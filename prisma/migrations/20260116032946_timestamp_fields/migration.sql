/*
  Warnings:

  - The `careShareStartAt` column on the `Pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `careShareEndAt` column on the `Pet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "careShareStartAt",
ADD COLUMN     "careShareStartAt" TIMESTAMP(3),
DROP COLUMN "careShareEndAt",
ADD COLUMN     "careShareEndAt" TIMESTAMP(3);
