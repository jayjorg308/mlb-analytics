/*
  Warnings:

  - You are about to alter the column `pitchingScore` on the `PlayerGamePitchingStats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "PlayerGamePitchingStats" ALTER COLUMN "pitchingScore" SET DATA TYPE DOUBLE PRECISION;
