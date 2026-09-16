import { db } from "../lib/db";
import {
  BillingInterval,
  ClassLevel,
  ExamBoard,
  PlanTier,
  Subject,
} from "@prisma/client";

async function main(): Promise<void> {
  process.stdout.write("Starting database seed with locked plans and synthetic fixtures...\n");

  // 1. Seed Plans (PRD 8.1 - prices in integer kobo, never floats)
  const plans = [
    {
      code: "free",
      tier: PlanTier.FREE,
      interval: null,
      priceKobo: 0,
      currency: "NGN",
      dailyQuestionCap: 5,
      monthlyQuestionCap: 60,
      monthlyAtlasViews: 0,
      allowsAtlasGeneration: false,
      allowsOffline: true,
      allowsParentSummary: true,
      isActive: true,
    },
    {
      code: "plus_monthly",
      tier: PlanTier.PLUS,
      interval: BillingInterval.MONTHLY,
      priceKobo: 249900, // ₦2,499 in kobo (PRD 8.1)
      currency: "NGN",
      dailyQuestionCap: null,
      monthlyQuestionCap: null,
      monthlyAtlasViews: 0,
      allowsAtlasGeneration: false,
      allowsOffline: true,
      allowsParentSummary: true,
      isActive: true,
    },
    {
      code: "plus_annual",
      tier: PlanTier.PLUS,
      interval: BillingInterval.ANNUAL,
      priceKobo: 2200000, // ₦22,000 in kobo (PRD 8.1)
      currency: "NGN",
      dailyQuestionCap: null,
      monthlyQuestionCap: null,
      monthlyAtlasViews: 0,
      allowsAtlasGeneration: false,
      allowsOffline: true,
      allowsParentSummary: true,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await db.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: plan,
    });
  }
  process.stdout.write(`Seeded ${plans.length} plans successfully.\n`);

  // 2. Seed Synthetic Syllabus Topics (Phase 0 gate open: synthetic only)
  const mathTopic = await db.syllabusTopic.upsert({
    where: {
      board_subject_code: {
        board: ExamBoard.WAEC,
        subject: Subject.MATHEMATICS,
        code: "MTH-SYN-001",
      },
    },
    create: {
      board: ExamBoard.WAEC,
      subject: Subject.MATHEMATICS,
      code: "MTH-SYN-001",
      title: "Linear and Quadratic Equations",
      slug: "waec-math-linear-quadratic-equations",
      classLevels: [ClassLevel.SS1, ClassLevel.SS2, ClassLevel.SS3],
      frequencyRank: 1,
    },
    update: {
      title: "Linear and Quadratic Equations",
      classLevels: [ClassLevel.SS1, ClassLevel.SS2, ClassLevel.SS3],
    },
  });

  const physicsTopic = await db.syllabusTopic.upsert({
    where: {
      board_subject_code: {
        board: ExamBoard.WAEC,
        subject: Subject.PHYSICS,
        code: "PHY-SYN-001",
      },
    },
    create: {
      board: ExamBoard.WAEC,
      subject: Subject.PHYSICS,
      code: "PHY-SYN-001",
      title: "Scalars, Vectors and Motion in One Dimension",
      slug: "waec-physics-motion-one-dimension",
      classLevels: [ClassLevel.SS1, ClassLevel.SS2],
      frequencyRank: 2,
    },
    update: {
      title: "Scalars, Vectors and Motion in One Dimension",
      classLevels: [ClassLevel.SS1, ClassLevel.SS2],
    },
  });

  process.stdout.write("Seeded synthetic syllabus topics.\n");

  // 3. Seed Synthetic Past Questions (Rule 25 & 26: sourceLicence required, synthetic only)
  const syntheticQuestions = [
    {
      id: "syn_math_q001",
      board: ExamBoard.WAEC,
      subject: Subject.MATHEMATICS,
      year: 2024,
      paper: "Paper 2",
      questionNumber: "1a",
      bodyText: "Solve the linear equation: 3(x - 2) + 4 = 19.",
      bodyLatex: "3(x - 2) + 4 = 19",
      topicId: mathTopic.id,
      sourceLicence: "SYNTHETIC_FIXTURE_PHASE0_DEVELOPMENT",
      sourceNote: "Synthetic benchmark fixture created for pipeline testing without copyrighted WAEC material.",
    },
    {
      id: "syn_phy_q001",
      board: ExamBoard.WAEC,
      subject: Subject.PHYSICS,
      year: 2024,
      paper: "Paper 2",
      questionNumber: "2a",
      bodyText: "A car accelerates uniformly from rest to a velocity of 20 m/s in 10 seconds. Calculate its acceleration.",
      bodyLatex: "v = u + at, u = 0 \\text{ m/s}, v = 20 \\text{ m/s}, t = 10 \\text{ s}",
      topicId: physicsTopic.id,
      sourceLicence: "SYNTHETIC_FIXTURE_PHASE0_DEVELOPMENT",
      sourceNote: "Synthetic benchmark fixture created for pipeline testing without copyrighted WAEC material.",
    },
  ];

  for (const q of syntheticQuestions) {
    await db.pastQuestion.upsert({
      where: { id: q.id },
      create: q,
      update: q,
    });
  }
  process.stdout.write(`Seeded ${syntheticQuestions.length} synthetic past questions.\n`);
  process.stdout.write("Database seeding finished cleanly.\n");
}

main()
  .catch((e: unknown) => {
    process.stderr.write(`Seed failed: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
