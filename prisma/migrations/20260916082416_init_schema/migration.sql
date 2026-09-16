-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3');

-- CreateEnum
CREATE TYPE "TargetExam" AS ENUM ('WAEC', 'NECO', 'JAMB', 'NONE');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PLUS', 'ATLAS');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH', 'HISTORY');

-- CreateEnum
CREATE TYPE "ExamBoard" AS ENUM ('WAEC', 'NECO', 'JAMB');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'AWAITING_CROP', 'AWAITING_CONFIRM', 'SOLVING', 'COMPLETE', 'FAILED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "IntegritySignalType" AS ENUM ('EXAM_WINDOW_BURST', 'RAPID_SEQUENTIAL', 'NON_ACADEMIC_UPLOAD', 'MULTI_ACCOUNT_DEVICE');

-- CreateEnum
CREATE TYPE "AtlasLayout" AS ENUM ('MAP', 'TIMELINE', 'CUTAWAY', 'PROCESS');

-- CreateEnum
CREATE TYPE "PublishState" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('WRONG_ANSWER', 'WRONG_METHOD', 'UNREADABLE', 'INAPPROPRIATE', 'SOURCE_PROBLEM', 'OTHER');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('OPEN', 'TRIAGED', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "phone" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classLevel" "ClassLevel" NOT NULL,
    "targetExam" "TargetExam" NOT NULL DEFAULT 'NONE',
    "schoolName" TEXT,
    "stateCode" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isMinorUnder13" BOOLEAN NOT NULL DEFAULT false,
    "consentGrantedAt" TIMESTAMP(3),
    "consentPhone" TEXT,
    "consentRevokedAt" TIMESTAMP(3),
    "honourCodeAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianLink" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "interval" "BillingInterval",
    "priceKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "dailyQuestionCap" INTEGER,
    "monthlyQuestionCap" INTEGER,
    "monthlyAtlasViews" INTEGER,
    "allowsAtlasGeneration" BOOLEAN NOT NULL DEFAULT false,
    "allowsOffline" BOOLEAN NOT NULL DEFAULT false,
    "allowsParentSummary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "payerUserId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "paystackCustomerCode" TEXT,
    "paystackSubCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "feeKobo" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "channel" TEXT,
    "paystackRef" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "questionsUsed" INTEGER NOT NULL DEFAULT 0,
    "quizzesUsed" INTEGER NOT NULL DEFAULT 0,
    "atlasViewsUsed" INTEGER NOT NULL DEFAULT 0,
    "atlasGensUsed" INTEGER NOT NULL DEFAULT 0,
    "inferenceCostMicros" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusTopic" (
    "id" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "board" "ExamBoard" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "classLevels" "ClassLevel"[],
    "frequencyRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyllabusTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastQuestion" (
    "id" TEXT NOT NULL,
    "board" "ExamBoard" NOT NULL,
    "subject" "Subject" NOT NULL,
    "year" INTEGER NOT NULL,
    "paper" TEXT,
    "questionNumber" TEXT,
    "bodyText" TEXT NOT NULL,
    "bodyLatex" TEXT,
    "optionsJson" JSONB,
    "correctOption" TEXT,
    "markingScheme" TEXT,
    "topicId" TEXT,
    "embedding" vector(768),
    "sourceLicence" TEXT,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'UPLOADED',
    "inputMethod" TEXT NOT NULL,
    "imageKey" TEXT,
    "imagePurgedAt" TIMESTAMP(3),
    "transcribedText" TEXT,
    "transcribedLatex" TEXT,
    "studentEditedText" BOOLEAN NOT NULL DEFAULT false,
    "subject" "Subject",
    "topicId" TEXT,
    "matchedPastQuestionId" TEXT,
    "matchScore" DOUBLE PRECISION,
    "embedding" vector(768),
    "detectedCount" INTEGER NOT NULL DEFAULT 1,
    "extractionConfidence" DOUBLE PRECISION,
    "attemptedAnswer" TEXT,
    "revealedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "finalAnswer" TEXT,
    "finalAnswerLatex" TEXT,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "explanation" TEXT,
    "followUpPrompt" TEXT,
    "followUpAnswer" TEXT,
    "cacheId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionStep" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "workingLatex" TEXT,
    "markNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizItem" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "topicId" TEXT,
    "sourcePastQuestionId" TEXT,
    "ordinal" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "correctOption" TEXT NOT NULL,
    "rationale" TEXT,

    CONSTRAINT "QuizItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "total" INTEGER,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegritySignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" "IntegritySignalType" NOT NULL,
    "examWindow" BOOLEAN NOT NULL DEFAULT false,
    "boardInPlay" "ExamBoard",
    "itemCount" INTEGER,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "notedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegritySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasWorld" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "layout" "AtlasLayout" NOT NULL,
    "sceneSvgKey" TEXT,
    "payloadBytes" INTEGER,
    "state" "PublishState" NOT NULL DEFAULT 'DRAFT',
    "sensitiveTopic" BOOLEAN NOT NULL DEFAULT false,
    "generationCostMicros" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AtlasWorld_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasNode" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "bodyText" TEXT,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "timelineAt" TIMESTAMP(3),

    CONSTRAINT "AtlasNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "licence" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "assetKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtlasSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtlasNodeSource" (
    "nodeId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "AtlasNodeSource_pkey" PRIMARY KEY ("nodeId","sourceId")
);

-- CreateTable
CREATE TABLE "AtlasView" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodesOpened" INTEGER NOT NULL DEFAULT 0,
    "dwellSeconds" INTEGER NOT NULL DEFAULT 0,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtlasView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionId" TEXT,
    "worldId" TEXT,
    "reason" "FlagReason" NOT NULL,
    "note" TEXT,
    "status" "FlagStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReview" (
    "id" TEXT NOT NULL,
    "flagId" TEXT,
    "worldId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "correction" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelCall" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "worldId" TEXT,
    "stage" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costMicros" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "succeeded" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionCache" (
    "id" TEXT NOT NULL,
    "normalisedHash" TEXT NOT NULL,
    "embedding" vector(768),
    "subject" "Subject" NOT NULL,
    "topicId" TEXT,
    "payload" JSONB NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_classLevel_targetExam_idx" ON "StudentProfile"("classLevel", "targetExam");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLink_linkCode_key" ON "GuardianLink"("linkCode");

-- CreateIndex
CREATE INDEX "GuardianLink_studentId_idx" ON "GuardianLink"("studentId");

-- CreateIndex
CREATE INDEX "GuardianLink_linkCode_idx" ON "GuardianLink"("linkCode");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLink_guardianId_studentId_key" ON "GuardianLink"("guardianId", "studentId");

-- CreateIndex
CREATE INDEX "Device_fingerprint_idx" ON "Device"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_fingerprint_key" ON "Device"("userId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_status_idx" ON "Subscription"("currentPeriodEnd", "status");

-- CreateIndex
CREATE INDEX "Subscription_paystackSubCode_idx" ON "Subscription"("paystackSubCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackRef_key" ON "Payment"("paystackRef");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_createdAt_idx" ON "Payment"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageCounter_day_idx" ON "UsageCounter"("day");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_userId_day_key" ON "UsageCounter"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusTopic_slug_key" ON "SyllabusTopic"("slug");

-- CreateIndex
CREATE INDEX "SyllabusTopic_subject_board_frequencyRank_idx" ON "SyllabusTopic"("subject", "board", "frequencyRank");

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusTopic_board_subject_code_key" ON "SyllabusTopic"("board", "subject", "code");

-- CreateIndex
CREATE INDEX "PastQuestion_board_subject_year_idx" ON "PastQuestion"("board", "subject", "year");

-- CreateIndex
CREATE INDEX "PastQuestion_topicId_idx" ON "PastQuestion"("topicId");

-- CreateIndex
CREATE INDEX "QuestionSubmission_userId_createdAt_idx" ON "QuestionSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionSubmission_topicId_createdAt_idx" ON "QuestionSubmission"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionSubmission_status_createdAt_idx" ON "QuestionSubmission"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_submissionId_key" ON "Solution"("submissionId");

-- CreateIndex
CREATE INDEX "Solution_confidence_verified_idx" ON "Solution"("confidence", "verified");

-- CreateIndex
CREATE INDEX "Solution_cacheId_idx" ON "Solution"("cacheId");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionStep_solutionId_ordinal_key" ON "SolutionStep"("solutionId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_submissionId_key" ON "Quiz"("submissionId");

-- CreateIndex
CREATE INDEX "QuizItem_topicId_idx" ON "QuizItem"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizItem_quizId_ordinal_key" ON "QuizItem"("quizId", "ordinal");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_completedAt_idx" ON "QuizAttempt"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizResponse_attemptId_itemId_key" ON "QuizResponse"("attemptId", "itemId");

-- CreateIndex
CREATE INDEX "IntegritySignal_userId_notedAt_idx" ON "IntegritySignal"("userId", "notedAt");

-- CreateIndex
CREATE INDEX "IntegritySignal_signalType_notedAt_idx" ON "IntegritySignal"("signalType", "notedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AtlasWorld_slug_key" ON "AtlasWorld"("slug");

-- CreateIndex
CREATE INDEX "AtlasWorld_state_publishedAt_idx" ON "AtlasWorld"("state", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AtlasWorld_topicId_version_key" ON "AtlasWorld"("topicId", "version");

-- CreateIndex
CREATE INDEX "AtlasNode_worldId_depth_idx" ON "AtlasNode"("worldId", "depth");

-- CreateIndex
CREATE INDEX "AtlasSource_licence_idx" ON "AtlasSource"("licence");

-- CreateIndex
CREATE INDEX "AtlasView_userId_viewedAt_idx" ON "AtlasView"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "AtlasView_worldId_viewedAt_idx" ON "AtlasView"("worldId", "viewedAt");

-- CreateIndex
CREATE INDEX "ContentFlag_status_createdAt_idx" ON "ContentFlag"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentFlag_userId_idx" ON "ContentFlag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentReview_flagId_key" ON "ContentReview"("flagId");

-- CreateIndex
CREATE INDEX "ContentReview_reviewerId_reviewedAt_idx" ON "ContentReview"("reviewerId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ModelCall_stage_createdAt_idx" ON "ModelCall"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "ModelCall_model_createdAt_idx" ON "ModelCall"("model", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionCache_normalisedHash_key" ON "SolutionCache"("normalisedHash");

-- CreateIndex
CREATE INDEX "SolutionCache_subject_topicId_idx" ON "SolutionCache"("subject", "topicId");

-- CreateIndex
CREATE INDEX "SolutionCache_hitCount_idx" ON "SolutionCache"("hitCount");

-- CreateIndex (HNSW vector indexes per PRD 11.2)
CREATE INDEX "PastQuestion_embedding_hnsw_idx" ON "PastQuestion" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "SolutionCache_embedding_hnsw_idx" ON "SolutionCache" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusTopic" ADD CONSTRAINT "SyllabusTopic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastQuestion" ADD CONSTRAINT "PastQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_matchedPastQuestionId_fkey" FOREIGN KEY ("matchedPastQuestionId") REFERENCES "PastQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestionSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_cacheId_fkey" FOREIGN KEY ("cacheId") REFERENCES "SolutionCache"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionStep" ADD CONSTRAINT "SolutionStep_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestionSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizItem" ADD CONSTRAINT "QuizItem_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizItem" ADD CONSTRAINT "QuizItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "QuizItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegritySignal" ADD CONSTRAINT "IntegritySignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasWorld" ADD CONSTRAINT "AtlasWorld_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "SyllabusTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasNode" ADD CONSTRAINT "AtlasNode_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "AtlasWorld"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasNode" ADD CONSTRAINT "AtlasNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AtlasNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasNodeSource" ADD CONSTRAINT "AtlasNodeSource_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "AtlasNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasNodeSource" ADD CONSTRAINT "AtlasNodeSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AtlasSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasView" ADD CONSTRAINT "AtlasView_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "AtlasWorld"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtlasView" ADD CONSTRAINT "AtlasView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFlag" ADD CONSTRAINT "ContentFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFlag" ADD CONSTRAINT "ContentFlag_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestionSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFlag" ADD CONSTRAINT "ContentFlag_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "AtlasWorld"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "ContentFlag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "AtlasWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCall" ADD CONSTRAINT "ModelCall_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestionSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCall" ADD CONSTRAINT "ModelCall_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "AtlasWorld"("id") ON DELETE SET NULL ON UPDATE CASCADE;
