-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "isNeutralSite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPostseason" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InningDetails" ALTER COLUMN "homeRuns" DROP NOT NULL,
ALTER COLUMN "awayRuns" DROP NOT NULL,
ALTER COLUMN "homeHits" DROP NOT NULL,
ALTER COLUMN "awayHits" DROP NOT NULL,
ALTER COLUMN "homeErrors" DROP NOT NULL,
ALTER COLUMN "awayErrors" DROP NOT NULL,
ALTER COLUMN "homeLeftOn" DROP NOT NULL,
ALTER COLUMN "awayLeftOn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PlayerGamePitchingStats" ADD COLUMN     "pitchingScore" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PlayerSeasonPitchingStats" ADD COLUMN     "runningPitcherScore" DECIMAL(65,30);
