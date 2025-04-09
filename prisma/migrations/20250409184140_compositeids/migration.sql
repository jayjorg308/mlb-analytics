/*
  Warnings:

  - The primary key for the `InningDetails` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `InningDetails` table. All the data in the column will be lost.
  - The primary key for the `PlayerGameBattingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlayerGameBattingStats` table. All the data in the column will be lost.
  - The primary key for the `PlayerGamePitchingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlayerGamePitchingStats` table. All the data in the column will be lost.
  - The primary key for the `PlayerSeasonBattingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlayerSeasonBattingStats` table. All the data in the column will be lost.
  - The primary key for the `PlayerSeasonPitchingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PlayerSeasonPitchingStats` table. All the data in the column will be lost.
  - You are about to alter the column `runningPitcherScore` on the `PlayerSeasonPitchingStats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - The primary key for the `TeamGameBattingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamGameBattingStats` table. All the data in the column will be lost.
  - The primary key for the `TeamGameFieldingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamGameFieldingStats` table. All the data in the column will be lost.
  - The primary key for the `TeamGamePitchingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamGamePitchingStats` table. All the data in the column will be lost.
  - The primary key for the `TeamSeasonBattingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamSeasonBattingStats` table. All the data in the column will be lost.
  - The primary key for the `TeamSeasonFieldingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamSeasonFieldingStats` table. All the data in the column will be lost.
  - The primary key for the `TeamSeasonPitchingStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamSeasonPitchingStats` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "InningDetails_gameId_inning_key";

-- DropIndex
DROP INDEX "PlayerGameBattingStats_playerId_gameId_key";

-- DropIndex
DROP INDEX "PlayerGamePitchingStats_playerId_gameId_key";

-- DropIndex
DROP INDEX "PlayerSeasonBattingStats_playerId_seasonId_key";

-- DropIndex
DROP INDEX "PlayerSeasonPitchingStats_playerId_seasonId_key";

-- DropIndex
DROP INDEX "TeamGameBattingStats_teamId_gameId_key";

-- DropIndex
DROP INDEX "TeamGameFieldingStats_teamId_gameId_key";

-- DropIndex
DROP INDEX "TeamGamePitchingStats_teamId_gameId_key";

-- DropIndex
DROP INDEX "TeamSeasonBattingStats_teamId_seasonId_key";

-- DropIndex
DROP INDEX "TeamSeasonFieldingStats_teamId_seasonId_key";

-- DropIndex
DROP INDEX "TeamSeasonPitchingStats_teamId_seasonId_key";

-- AlterTable
ALTER TABLE "InningDetails" DROP CONSTRAINT "InningDetails_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "InningDetails_pkey" PRIMARY KEY ("gameId", "inning");

-- AlterTable
ALTER TABLE "PlayerGameBattingStats" DROP CONSTRAINT "PlayerGameBattingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PlayerGameBattingStats_pkey" PRIMARY KEY ("playerId", "gameId");

-- AlterTable
ALTER TABLE "PlayerGamePitchingStats" DROP CONSTRAINT "PlayerGamePitchingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PlayerGamePitchingStats_pkey" PRIMARY KEY ("playerId", "gameId");

-- AlterTable
ALTER TABLE "PlayerSeasonBattingStats" DROP CONSTRAINT "PlayerSeasonBattingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PlayerSeasonBattingStats_pkey" PRIMARY KEY ("playerId", "seasonId");

-- AlterTable
ALTER TABLE "PlayerSeasonPitchingStats" DROP CONSTRAINT "PlayerSeasonPitchingStats_pkey",
DROP COLUMN "id",
ALTER COLUMN "runningPitcherScore" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "PlayerSeasonPitchingStats_pkey" PRIMARY KEY ("playerId", "seasonId");

-- AlterTable
ALTER TABLE "TeamGameBattingStats" DROP CONSTRAINT "TeamGameBattingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamGameBattingStats_pkey" PRIMARY KEY ("teamId", "gameId");

-- AlterTable
ALTER TABLE "TeamGameFieldingStats" DROP CONSTRAINT "TeamGameFieldingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamGameFieldingStats_pkey" PRIMARY KEY ("teamId", "gameId");

-- AlterTable
ALTER TABLE "TeamGamePitchingStats" DROP CONSTRAINT "TeamGamePitchingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamGamePitchingStats_pkey" PRIMARY KEY ("teamId", "gameId");

-- AlterTable
ALTER TABLE "TeamSeasonBattingStats" DROP CONSTRAINT "TeamSeasonBattingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamSeasonBattingStats_pkey" PRIMARY KEY ("teamId", "seasonId");

-- AlterTable
ALTER TABLE "TeamSeasonFieldingStats" DROP CONSTRAINT "TeamSeasonFieldingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamSeasonFieldingStats_pkey" PRIMARY KEY ("teamId", "seasonId");

-- AlterTable
ALTER TABLE "TeamSeasonPitchingStats" DROP CONSTRAINT "TeamSeasonPitchingStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamSeasonPitchingStats_pkey" PRIMARY KEY ("teamId", "seasonId");
