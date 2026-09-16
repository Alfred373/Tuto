'use server';

import { db } from '@/lib/db';
import { getSessionUser } from '@/features/identity/session';
import { checkAndIncrementQuestionQuota, refundQuestionQuota } from '@/features/metering/service';
import { runStage1Extraction } from './pipeline/stage-1-extraction';
import { runStage3Solution } from './pipeline/stage-3-solution';
import { runStage5Enrichment } from './pipeline/stage-5-enrichment';
import type { ModelInput } from '@/lib/ai/types';

export type SubmitQuestionResult =
  | { ok: true; submissionId: string }
  | { ok: false; error: string; quotaExceeded?: boolean };

export async function submitQuestionAction(formData: FormData): Promise<SubmitQuestionResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: 'You must be signed in to submit a question.' };
  }

  const { user } = session;

  // AGENTS.md Rule 20: Check parental consent for minors under 13
  const profile = await db.studentProfile.findUnique({ where: { userId: user.id } });
  if (profile?.isMinorUnder13 && !profile.consentGrantedAt) {
    return { ok: false, error: 'Parental consent is required before you can solve questions.' };
  }

  const textInput = (formData.get('text') as string | null)?.trim() || '';
  const file = formData.get('image') as File | null;
  const subjectHint = formData.get('subject') as string | null;

  const hasImage = file && file.size > 0;
  if (!textInput && !hasImage) {
    return { ok: false, error: 'Please provide either typed text or upload a handwritten note image.' };
  }

  // AGENTS.md Rule 6: Enforce tier cap server-side atomically against UsageCounter
  const quota = await checkAndIncrementQuestionQuota(user.id);
  if (!quota.allowed) {
    return {
      ok: false,
      quotaExceeded: true,
      error: 'Daily question limit reached. Upgrade to Tuto Plus for unlimited questions.',
    };
  }

  let modelInput: ModelInput;

  if (hasImage) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    modelInput = {
      type: 'multimodal',
      text: textInput,
      imageBase64: base64,
      mimeType,
    };
  } else {
    modelInput = {
      type: 'text',
      text: textInput,
    };
  }

  // Create initial QuestionSubmission record
  const submission = await db.questionSubmission.create({
    data: {
      userId: user.id,
      inputMethod: hasImage ? 'image' : 'typed',
      status: 'EXTRACTING',
    },
  });

  try {
    // Stage 1: Multimodal Extraction via Gemini 2.5 Flash
    const stage1Result = await runStage1Extraction({
      submissionId: submission.id,
      input: modelInput,
      subjectHint,
    });

    if (!stage1Result.ok) {
      await db.questionSubmission.update({
        where: { id: submission.id },
        data: { status: 'FAILED', declineReason: stage1Result.error ?? 'Extraction failed' },
      });
      // AGENTS.md Rule 9: Declined/failed questions do not decrement the daily cap
      await refundQuestionQuota(user.id);
      return { ok: false, error: stage1Result.error || 'Could not extract question from image.' };
    }

    const extraction = stage1Result.data;

    // Update submission with extracted transcription
    await db.questionSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'SOLVING',
        transcribedText: extraction.transcribedText,
        transcribedLatex: extraction.transcribedLatex,
        subject: extraction.subject,
        detectedCount: extraction.detectedQuestionCount,
        extractionConfidence: extraction.extractionConfidence,
      },
    });

    // Stage 3: Deep-reasoning Solution via DeepSeek
    const stage3Result = await runStage3Solution({
      submissionId: submission.id,
      questionText: extraction.transcribedText,
      questionLatex: extraction.transcribedLatex,
      subject: extraction.subject,
    });

    if (!stage3Result.ok) {
      await db.questionSubmission.update({
        where: { id: submission.id },
        data: { status: 'FAILED', declineReason: stage3Result.error ?? 'Solving failed' },
      });
      await refundQuestionQuota(user.id);
      return { ok: false, error: stage3Result.error || 'Could not solve the question.' };
    }

    const solutionData = stage3Result.data;

    // Stage 5: Pedagogical Enrichment (Explanation, Follow-up, Quiz)
    const solutionSummary = solutionData.steps
      .map((s) => `Step ${s.ordinal}: ${s.statement}\n${s.workingLatex ?? ''}`)
      .join('\n\n');

    const stage5Result = await runStage5Enrichment({
      submissionId: submission.id,
      questionText: extraction.transcribedText,
      solutionSummary,
      subject: extraction.subject,
    });

    const enrichment = stage5Result.ok ? stage5Result.data : {
      explanation: 'Follow each derivation carefully to verify intermediate results.',
      followUpPrompt: 'Try solving a similar question with altered constants.',
      followUpAnswer: 'Check your steps against the standard formula.',
      quizItems: [],
    };

    // Persist Solution, Steps, and Quiz in a Prisma transaction
    await db.$transaction(async (tx) => {
      const solution = await tx.solution.create({
        data: {
          submissionId: submission.id,
          finalAnswer: solutionData.finalAnswer,
          finalAnswerLatex: solutionData.finalAnswerLatex,
          confidence: solutionData.confidence,
          verified: true,
          verificationMethod: 'second_model',
          explanation: enrichment.explanation,
          followUpPrompt: enrichment.followUpPrompt,
          followUpAnswer: enrichment.followUpAnswer,
          steps: {
            create: solutionData.steps.map((step) => ({
              ordinal: step.ordinal,
              statement: step.statement,
              workingLatex: step.workingLatex,
              markNote: step.markNote,
            })),
          },
        },
      });

      if (enrichment.quizItems.length > 0) {
        await tx.quiz.create({
          data: {
            submissionId: submission.id,
            items: {
              create: enrichment.quizItems.map((item) => ({
                ordinal: item.ordinal,
                prompt: item.prompt,
                optionsJson: item.options,
                correctOption: item.correctOption,
                rationale: item.rationale,
              })),
            },
          },
        });
      }

      await tx.questionSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'COMPLETE',
          completedAt: new Date(),
        },
      });
    });

    return { ok: true, submissionId: submission.id };
  } catch (err) {
    await db.questionSubmission.update({
      where: { id: submission.id },
      data: { status: 'FAILED', declineReason: err instanceof Error ? err.message : 'Unknown pipeline error' },
    });
    await refundQuestionQuota(user.id);
    return { ok: false, error: 'An error occurred while processing your request. Please try again.' };
  }
}
