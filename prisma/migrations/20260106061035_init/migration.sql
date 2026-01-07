-- CreateEnum
CREATE TYPE "AdoptionSource" AS ENUM ('shelter', 'agency', 'private', 'rescue', 'other');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('dry', 'wet', 'mixed', 'prescription');

-- CreateEnum
CREATE TYPE "WaterSource" AS ENUM ('fountain', 'bowl', 'mixed');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "LivingEnvironment" AS ENUM ('indoor', 'outdoor', 'both');

-- CreateEnum
CREATE TYPE "WaterIntakeTendency" AS ENUM ('low', 'normal', 'high', 'unknown');

-- CreateEnum
CREATE TYPE "NotificationPreference" AS ENUM ('all', 'important', 'none');

-- CreateEnum
CREATE TYPE "MedicationSelectionSource" AS ENUM ('recommended', 'search');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "alarmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alarmConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adoptionPath" TEXT NOT NULL,
    "adoptionSource" "AdoptionSource",
    "adoptionAgencyCode" TEXT,
    "agencyCode" TEXT,
    "dataSharing" JSONB,
    "careShareStartAt" INTEGER,
    "careShareEndAt" INTEGER,
    "birthDate" TEXT,
    "estimatedAge" INTEGER,
    "unknownBirthday" BOOLEAN NOT NULL,
    "gender" "Gender" NOT NULL,
    "neutered" BOOLEAN NOT NULL,
    "breed" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bcs" DOUBLE PRECISION,
    "foodType" "FoodType" NOT NULL,
    "waterSource" "WaterSource" NOT NULL,
    "surveyFrequencyPerWeek" INTEGER,
    "surveyDays" "Weekday"[],
    "activityLevel" "ActivityLevel",
    "livingEnvironment" "LivingEnvironment",
    "multiCat" BOOLEAN,
    "catCount" INTEGER,
    "mealsPerDay" INTEGER,
    "waterIntakeTendency" "WaterIntakeTendency",
    "medicalHistory" JSONB,
    "medications" TEXT,
    "medicationText" TEXT,
    "medicationsSelected" JSONB,
    "medicationOtherText" TEXT,
    "notes" TEXT,
    "vetInfo" TEXT,
    "notificationPreference" "NotificationPreference",
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
