-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "pushToken" TEXT;
