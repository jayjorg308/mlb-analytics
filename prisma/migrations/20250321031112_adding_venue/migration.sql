/*
  Warnings:

  - A unique constraint covering the columns `[mlb_api_id]` on the table `games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `game_type` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venue_id` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('R', 'S', 'E', 'P', 'A');

-- DropForeignKey
ALTER TABLE "batter_vs_pitcher_stats" DROP CONSTRAINT "batter_vs_pitcher_stats_batterId_fkey";

-- DropForeignKey
ALTER TABLE "batter_vs_pitcher_stats" DROP CONSTRAINT "batter_vs_pitcher_stats_pitcherId_fkey";

-- DropForeignKey
ALTER TABLE "batting_orders" DROP CONSTRAINT "batting_orders_gameId_fkey";

-- DropForeignKey
ALTER TABLE "batting_orders" DROP CONSTRAINT "batting_orders_playerId_fkey";

-- DropForeignKey
ALTER TABLE "batting_orders" DROP CONSTRAINT "batting_orders_teamId_fkey";

-- DropForeignKey
ALTER TABLE "conferences" DROP CONSTRAINT "conferences_league_id_fkey";

-- DropForeignKey
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_conference_id_fkey";

-- DropForeignKey
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_league_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_away_team_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_home_team_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_league_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_season_id_fkey";

-- DropForeignKey
ALTER TABLE "injuries" DROP CONSTRAINT "injuries_playerId_fkey";

-- DropForeignKey
ALTER TABLE "player_positions" DROP CONSTRAINT "player_positions_playerId_fkey";

-- DropForeignKey
ALTER TABLE "player_positions" DROP CONSTRAINT "player_positions_positionId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_gameId_fkey";

-- DropForeignKey
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_playerId_fkey";

-- DropForeignKey
ALTER TABLE "seasons" DROP CONSTRAINT "seasons_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "starting_pitchers" DROP CONSTRAINT "starting_pitchers_gameId_fkey";

-- DropForeignKey
ALTER TABLE "starting_pitchers" DROP CONSTRAINT "starting_pitchers_playerId_fkey";

-- DropForeignKey
ALTER TABLE "starting_pitchers" DROP CONSTRAINT "starting_pitchers_teamId_fkey";

-- DropForeignKey
ALTER TABLE "team_stats" DROP CONSTRAINT "team_stats_gameId_fkey";

-- DropForeignKey
ALTER TABLE "team_stats" DROP CONSTRAINT "team_stats_teamId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_conference_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_division_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_league_id_fkey";

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "game_type" "GameType" NOT NULL,
ADD COLUMN     "mlb_api_id" INTEGER,
ADD COLUMN     "venue_id" INTEGER NOT NULL,
ADD COLUMN     "winner_team_id" INTEGER;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "venue_id" INTEGER;

-- CreateTable
CREATE TABLE "venues" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "mlb_api_id" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "zip" VARCHAR(10) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "isIndoor" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "turfType" VARCHAR(100),
    "leftFieldDistance" INTEGER,
    "leftCenterFieldDistance" INTEGER,
    "centerFieldDistance" INTEGER,
    "rightCenterFieldDistance" INTEGER,
    "rightFieldDistance" INTEGER,
    "yearOpened" INTEGER,
    "imageUrl" VARCHAR(255),
    "teamId" INTEGER,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRecord" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TeamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamToVenue" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeamToVenue_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_mlb_api_id_key" ON "venues"("mlb_api_id");

-- CreateIndex
CREATE INDEX "_TeamToVenue_B_index" ON "_TeamToVenue"("B");

-- CreateIndex
CREATE UNIQUE INDEX "games_mlb_api_id_key" ON "games"("mlb_api_id");

-- AddForeignKey
ALTER TABLE "conferences" ADD CONSTRAINT "conferences_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_conference_id_fkey" FOREIGN KEY ("conference_id") REFERENCES "conferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_positions" ADD CONSTRAINT "player_positions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_positions" ADD CONSTRAINT "player_positions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_stats" ADD CONSTRAINT "team_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_stats" ADD CONSTRAINT "team_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batter_vs_pitcher_stats" ADD CONSTRAINT "batter_vs_pitcher_stats_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batter_vs_pitcher_stats" ADD CONSTRAINT "batter_vs_pitcher_stats_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starting_pitchers" ADD CONSTRAINT "starting_pitchers_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starting_pitchers" ADD CONSTRAINT "starting_pitchers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starting_pitchers" ADD CONSTRAINT "starting_pitchers_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_orders" ADD CONSTRAINT "batting_orders_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_orders" ADD CONSTRAINT "batting_orders_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batting_orders" ADD CONSTRAINT "batting_orders_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamToVenue" ADD CONSTRAINT "_TeamToVenue_A_fkey" FOREIGN KEY ("A") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamToVenue" ADD CONSTRAINT "_TeamToVenue_B_fkey" FOREIGN KEY ("B") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
