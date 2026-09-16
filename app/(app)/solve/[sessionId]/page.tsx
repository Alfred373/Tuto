import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/features/identity/session';
import { db } from '@/lib/db';
import { SolutionViewer } from '@/features/solve/components/solution-viewer';

export const metadata: Metadata = {
  title: 'Guided Lesson | Tuto',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function SolveSessionPage(props: Props) {
  const session = await getSessionUser();
  if (!session) {
    redirect('/auth');
  }

  const { sessionId } = await props.params;

  // Security Rule 6: Scope query by session userId to prevent reading other students' solutions
  const submission = await db.questionSubmission.findFirst({
    where: {
      id: sessionId,
      userId: session.user.id,
    },
    include: {
      solution: {
        include: {
          steps: {
            orderBy: { ordinal: 'asc' },
          },
        },
      },
      quiz: {
        include: {
          items: {
            orderBy: { ordinal: 'asc' },
          },
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  return (
    <SolutionViewer
      submission={submission}
      solution={submission.solution}
      quiz={submission.quiz}
    />
  );
}
