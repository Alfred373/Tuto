import { z } from 'zod';
import { Subject, ConfidenceLevel } from '@prisma/client';

export const StageFailureSchema = z.enum([
  'blurry_image',
  'unreadable_handwriting',
  'multiple_questions',
  'out_of_syllabus',
  'cannot_solve',
  'provider_error',
  'validation_error',
  'timeout',
]);

export type StageFailure = z.infer<typeof StageFailureSchema>;

export type StageResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: StageFailure; error?: string };

// Stage 1 Output Schema
export const ExtractionOutputSchema = z.object({
  transcribedText: z.string().min(1),
  transcribedLatex: z.string().nullable().optional(),
  subject: (z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(Subject)
  ) as z.ZodType<Subject>),
  detectedQuestionCount: (z.preprocess(
    (val) => (val === undefined || val === null ? 1 : Number(val)),
    z.number().int().min(1)
  ) as z.ZodType<number>),
  extractionConfidence: (z.preprocess(
    (val) => (val === undefined || val === null ? 0.9 : Number(val)),
    z.number().min(0).max(1)
  ) as z.ZodType<number>),
  topicTitle: z.string().nullable().optional(),
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

// Stage 3 Output Schema
export const SolutionStepSchema = z.object({
  ordinal: z.coerce.number().int().min(1),
  statement: z.string().min(1),
  workingLatex: z.string().nullable().optional(),
  markNote: z.string().nullable().optional(),
});

export const SolutionOutputSchema = z.object({
  steps: z.array(SolutionStepSchema).min(1),
  finalAnswer: z.string().min(1),
  finalAnswerLatex: z.string().nullable().optional(),
  confidence: (z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(ConfidenceLevel)
  ) as z.ZodType<ConfidenceLevel>),
});

export type SolutionOutput = z.infer<typeof SolutionOutputSchema>;

// Stage 5 Output Schema
export const QuizItemSchema = z.object({
  ordinal: z.coerce.number().int().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string()).min(4).max(4),
  correctOption: (z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['A', 'B', 'C', 'D'])
  ) as z.ZodType<'A' | 'B' | 'C' | 'D'>),
  rationale: z.string().nullable().optional(),
});

export const EnrichmentOutputSchema = z.object({
  explanation: z.string().min(1),
  followUpPrompt: z.string().min(1),
  followUpAnswer: z.string().min(1),
  quizItems: z.array(QuizItemSchema).min(1).max(3),
});

export type EnrichmentOutput = z.infer<typeof EnrichmentOutputSchema>;
