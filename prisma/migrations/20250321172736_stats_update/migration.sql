/*
  Warnings:

  - You are about to drop the column `CenterFieldWallHeight` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `LeftCenterFieldWallHeight` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `RightCenterFieldWallHeight` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `RightFieldWallHeight` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the `TeamRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `player_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_stats` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PitcherDecision" AS ENUM ('WIN', 'LOSS', 'SAVE', 'HOLD', 'NO_DECISION');

-- DropForeignKey
ALTER TABLE "TeamRecord" DROP CONSTRAINT "TeamRecord_gameId_fkey";

-- DropForeignKey
ALTER TABLE "TeamRecord" DROP CONSTRAINT "TeamRecord_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "TeamRecord" DROP CONSTRAINT "TeamRecord_teamId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_gameId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "team_stats" DROP CONSTRAINT "team_stats_gameId_fkey";

-- DropForeignKey
ALTER TABLE "team_stats" DROP CONSTRAINT "team_stats_teamId_fkey";

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "CenterFieldWallHeight",
DROP COLUMN "LeftCenterFieldWallHeight",
DROP COLUMN "RightCenterFieldWallHeight",
DROP COLUMN "RightFieldWallHeight",
ADD COLUMN     "centerFieldWallHeight" INTEGER,
ADD COLUMN     "leftCenterFieldWallHeight" INTEGER,
ADD COLUMN     "rightCenterFieldWallHeight" INTEGER,
ADD COLUMN     "rightFieldWallHeight" INTEGER;

-- DropTable
DROP TABLE "TeamRecord";

-- DropTable
DROP TABLE "player_stats";

-- DropTable
DROP TABLE "team_stats";

-- CreateTable
CREATE TABLE "batting_stats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "atBats" INTEGER,
    "hits" INTEGER,
    "runs" INTEGER,
    "homeRuns" INTEGER,
    "rbis" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "battingAverage" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "xwOBA" DOUBLE PRECISION,

    CONSTRAINT "batting_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitching_stats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION,
    "pitchesThrown" INTEGER,
    "earnedRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "hitsAllowed" INTEGER,
    "homeRunsAllowed" INTEGER,
    "era" DOUBLE PRECISION,
    "whip" DOUBLE PRECISION,
    "decision" "PitcherDecision",
    "saves" INTEGER,
    "blownSaves" INTEGER,
    "xwOBAAgainst" DOUBLE PRECISION,

    CONSTRAINT "pitching_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_game_batting_stats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "atBats" INTEGER,
    "hits" INTEGER,
    "runs" INTEGER,
    "homeRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "LOB" INTEGER,

    CONSTRAINT "team_game_batting_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_game_pitching_stats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION,
    "earnedRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "hitsAllowed" INTEGER,
    "homeRunsAllowed" INTEGER,
    "errors" INTEGER,

    CONSTRAINT "team_game_pitching_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_records" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "team_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_season_batting_stats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER,
    "atBats" INTEGER,
    "hits" INTEGER,
    "runs" INTEGER,
    "doubles" INTEGER,
    "triples" INTEGER,
    "homeRuns" INTEGER,
    "rbis" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "stolenBases" INTEGER,
    "battingAverage" DOUBLE PRECISION,
    "onBasePercentage" DOUBLE PRECISION,
    "sluggingPercentage" DOUBLE PRECISION,
    "ops" DOUBLE PRECISION,
    "xwOBA" DOUBLE PRECISION,

    CONSTRAINT "player_season_batting_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_season_pitching_stats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "wins" INTEGER,
    "losses" INTEGER,
    "era" DOUBLE PRECISION,
    "gamesPlayed" INTEGER,
    "gamesStarted" INTEGER,
    "inningsPitched" DOUBLE PRECISION,
    "hits" INTEGER,
    "runs" INTEGER,
    "homeRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "earnedRuns" INTEGER,
    "saves" INTEGER,
    "blownSaves" INTEGER,
    "whip" DOUBLE PRECISION,
    "xwOBAAllowed" DOUBLE PRECISION,

    CONSTRAINT "player_season_pitching_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_season_batting_stats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "atBats" INTEGER,
    "hits" INTEGER,
    "runs" INTEGER,
    "homeRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "LOB" INTEGER,

    CONSTRAINT "team_season_batting_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_season_pitching_stats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION,
    "earnedRuns" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "hitsAllowed" INTEGER,
    "homeRunsAllowed" INTEGER,
    "errors" INTEGER,

    CONSTRAINT "team_season_pitching_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_inning_stats" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "inningNumber" INTEGER NOT NULL,
    "runsScored" INTEGER NOT NULL,
    "hits" INTEGER,
    "errors" INTEGER,
    "runnersLeftOnBase" INTEGER,

    CONSTRAINT "game_inning_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batting_stats_playerId_gameId_key" ON "batting_stats"("playerId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "pitching_stats_playerId_gameId_key" ON "pitching_stats"("playerId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "team_game_batting_stats_teamId_gameId_key" ON "team_game_batting_stats"("teamId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "team_game_pitching_stats_teamId_gameId_key" ON "team_game_pitching_stats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "team_records_teamId_seasonId_idx" ON "team_records"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_batting_stats_playerId_seasonId_key" ON "player_season_batting_stats"("playerId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "player_season_pitching_stats_playerId_seasonId_key" ON "player_season_pitching_stats"("playerId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "team_season_batting_stats_teamId_seasonId_key" ON "team_season_batting_stats"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "team_season_pitching_stats_teamId_seasonId_key" ON "team_season_pitching_stats"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "game_inning_stats_gameId_teamId_inningNumber_key" ON "game_inning_stats"("gameId", "teamId", "inningNumber");

-- AddForeignKey
ALTER TABLE "batting_stats" ADD CONSTRAINT "batting_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_stats" ADD CONSTRAINT "batting_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitching_stats" ADD CONSTRAINT "pitching_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitching_stats" ADD CONSTRAINT "pitching_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_game_batting_stats" ADD CONSTRAINT "team_game_batting_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_game_batting_stats" ADD CONSTRAINT "team_game_batting_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_game_pitching_stats" ADD CONSTRAINT "team_game_pitching_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_game_pitching_stats" ADD CONSTRAINT "team_game_pitching_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_records" ADD CONSTRAINT "team_records_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_records" ADD CONSTRAINT "team_records_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_records" ADD CONSTRAINT "team_records_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_batting_stats" ADD CONSTRAINT "player_season_batting_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_batting_stats" ADD CONSTRAINT "player_season_batting_stats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_pitching_stats" ADD CONSTRAINT "player_season_pitching_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_season_pitching_stats" ADD CONSTRAINT "player_season_pitching_stats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_batting_stats" ADD CONSTRAINT "team_season_batting_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_batting_stats" ADD CONSTRAINT "team_season_batting_stats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_pitching_stats" ADD CONSTRAINT "team_season_pitching_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_pitching_stats" ADD CONSTRAINT "team_season_pitching_stats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_inning_stats" ADD CONSTRAINT "game_inning_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_inning_stats" ADD CONSTRAINT "game_inning_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
