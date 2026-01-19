-- AlterTable
ALTER TABLE "CareLog" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "diagAnswers" JSONB,
ADD COLUMN     "diagQuestions" JSONB,
ADD COLUMN     "questions" JSONB,
ADD COLUMN     "reports" JSONB;
