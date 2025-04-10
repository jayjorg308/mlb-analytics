/*
  Warnings:

  - The primary key for the `TeamELO` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gameId` on the `TeamELO` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `TeamELO` table. All the data in the column will be lost.
  - You are about to alter the column `elo` on the `TeamELO` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `eloChange` on the `TeamELO` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - The primary key for the `TeamRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gameId` on the `TeamRecord` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `TeamRecord` table. All the data in the column will be lost.
  - You are about to alter the column `latitude` on the `Venue` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `Venue` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - Made the column `runningPitcherScore` on table `PlayerSeasonPitchingStats` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TeamELO" DROP CONSTRAINT "TeamELO_gameId_fkey";

-- DropForeignKey
ALTER TABLE "TeamRecord" DROP CONSTRAINT "TeamRecord_gameId_fkey";

-- DropIndex
DROP INDEX "PlayerGameBattingStats_gameId_idx";

-- DropIndex
DROP INDEX "PlayerGameBattingStats_playerId_idx";

-- DropIndex
DROP INDEX "PlayerGamePitchingStats_gameId_idx";

-- DropIndex
DROP INDEX "PlayerGamePitchingStats_playerId_idx";

-- DropIndex
DROP INDEX "PlayerSeasonBattingStats_playerId_idx";

-- DropIndex
DROP INDEX "PlayerSeasonBattingStats_seasonId_idx";

-- DropIndex
DROP INDEX "PlayerSeasonPitchingStats_playerId_idx";

-- DropIndex
DROP INDEX "PlayerSeasonPitchingStats_seasonId_idx";

-- DropIndex
DROP INDEX "TeamELO_seasonId_teamId_gameId_idx";

-- DropIndex
DROP INDEX "TeamELO_teamId_gameId_key";

-- DropIndex
DROP INDEX "TeamGameBattingStats_gameId_idx";

-- DropIndex
DROP INDEX "TeamGameBattingStats_teamId_idx";

-- DropIndex
DROP INDEX "TeamGameFieldingStats_gameId_idx";

-- DropIndex
DROP INDEX "TeamGameFieldingStats_teamId_idx";

-- DropIndex
DROP INDEX "TeamGamePitchingStats_gameId_idx";

-- DropIndex
DROP INDEX "TeamGamePitchingStats_teamId_idx";

-- DropIndex
DROP INDEX "TeamRecord_seasonId_teamId_gameId_idx";

-- DropIndex
DROP INDEX "TeamRecord_teamId_gameId_key";

-- DropIndex
DROP INDEX "TeamSeasonBattingStats_seasonId_idx";

-- DropIndex
DROP INDEX "TeamSeasonBattingStats_teamId_idx";

-- DropIndex
DROP INDEX "TeamSeasonFieldingStats_seasonId_idx";

-- DropIndex
DROP INDEX "TeamSeasonFieldingStats_teamId_idx";

-- DropIndex
DROP INDEX "TeamSeasonPitchingStats_seasonId_idx";

-- DropIndex
DROP INDEX "TeamSeasonPitchingStats_teamId_idx";

-- AlterTable
ALTER TABLE "PlayerSeasonPitchingStats" ALTER COLUMN "runningPitcherScore" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeamELO" DROP CONSTRAINT "TeamELO_pkey",
DROP COLUMN "gameId",
DROP COLUMN "id",
ALTER COLUMN "elo" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "eloChange" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "TeamELO_pkey" PRIMARY KEY ("teamId", "seasonId");

-- AlterTable
ALTER TABLE "TeamRecord" DROP CONSTRAINT "TeamRecord_pkey",
DROP COLUMN "gameId",
DROP COLUMN "id",
ADD CONSTRAINT "TeamRecord_pkey" PRIMARY KEY ("teamId", "seasonId");

-- AlterTable
ALTER TABLE "Venue" ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "PlayerGameBattingStats_playerId_gameId_idx" ON "PlayerGameBattingStats"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "PlayerGamePitchingStats_playerId_gameId_idx" ON "PlayerGamePitchingStats"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "PlayerSeasonBattingStats_playerId_seasonId_idx" ON "PlayerSeasonBattingStats"("playerId", "seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonPitchingStats_playerId_seasonId_idx" ON "PlayerSeasonPitchingStats"("playerId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamELO_teamId_seasonId_idx" ON "TeamELO"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamGameBattingStats_teamId_gameId_idx" ON "TeamGameBattingStats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamGameFieldingStats_teamId_gameId_idx" ON "TeamGameFieldingStats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamGamePitchingStats_teamId_gameId_idx" ON "TeamGamePitchingStats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamRecord_teamId_seasonId_idx" ON "TeamRecord"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonBattingStats_teamId_seasonId_idx" ON "TeamSeasonBattingStats"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonFieldingStats_teamId_seasonId_idx" ON "TeamSeasonFieldingStats"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonPitchingStats_teamId_seasonId_idx" ON "TeamSeasonPitchingStats"("teamId", "seasonId");
