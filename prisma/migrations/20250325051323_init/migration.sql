-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINAL', 'POSTPONED');

-- CreateEnum
CREATE TYPE "PitcherDecision" AS ENUM ('WIN', 'LOSS', 'SAVE', 'HOLD', 'NO_DECISION');

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "mlb_api_id" INTEGER NOT NULL,
    "venue_id" INTEGER,
    "city" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "logo_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "mlb_api_id" INTEGER,
    "season_id" INTEGER NOT NULL,
    "venue_id" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winningTeamId" INTEGER,
    "startingPitcherHomeId" INTEGER,
    "startingPitcherAwayId" INTEGER,
    "battingOrderHome" TEXT[],
    "battingOrderAway" TEXT[],

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "mlb_api_id" INTEGER,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "uniformNumber" INTEGER,
    "photoUrl" VARCHAR(255) NOT NULL,
    "teamId" INTEGER,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGameStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "RBIs" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION,
    "strikeouts" INTEGER,
    "earnedRuns" INTEGER,
    "decision" "PitcherDecision",

    CONSTRAINT "PlayerGameStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "RBIs" INTEGER NOT NULL,

    CONSTRAINT "PlayerSeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "homeWins" INTEGER NOT NULL DEFAULT 0,
    "homeLosses" INTEGER NOT NULL DEFAULT 0,
    "awayWins" INTEGER NOT NULL DEFAULT 0,
    "awayLosses" INTEGER NOT NULL DEFAULT 0,
    "runsScored" INTEGER NOT NULL,
    "runsAllowed" INTEGER NOT NULL,

    CONSTRAINT "TeamSeasonStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "status" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedReturn" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "mlb_api_id" INTEGER NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "isIndoor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Team_mlb_api_id_key" ON "Team"("mlb_api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_abbreviation_key" ON "Team"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Game_mlb_api_id_key" ON "Game"("mlb_api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Game_winningTeamId_key" ON "Game"("winningTeamId");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_idx" ON "Game"("homeTeamId");

-- CreateIndex
CREATE INDEX "Game_awayTeamId_idx" ON "Game"("awayTeamId");

-- CreateIndex
CREATE INDEX "Game_season_id_date_idx" ON "Game"("season_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Player_mlb_api_id_key" ON "Player"("mlb_api_id");

-- CreateIndex
CREATE INDEX "Player_teamId_lastName_idx" ON "Player"("teamId", "lastName");

-- CreateIndex
CREATE INDEX "PlayerGameStats_playerId_idx" ON "PlayerGameStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerGameStats_gameId_idx" ON "PlayerGameStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStats_playerId_key" ON "PlayerSeasonStats"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStats_seasonId_key" ON "PlayerSeasonStats"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonStats_playerId_idx" ON "PlayerSeasonStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerSeasonStats_seasonId_idx" ON "PlayerSeasonStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStats_teamId_key" ON "TeamSeasonStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStats_seasonId_key" ON "TeamSeasonStats"("seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonStats_teamId_idx" ON "TeamSeasonStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamSeasonStats_seasonId_idx" ON "TeamSeasonStats"("seasonId");

-- CreateIndex
CREATE INDEX "Injury_playerId_idx" ON "Injury"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_mlb_api_id_key" ON "Venue"("mlb_api_id");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStats" ADD CONSTRAINT "PlayerGameStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStats" ADD CONSTRAINT "PlayerSeasonStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStats" ADD CONSTRAINT "TeamSeasonStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
