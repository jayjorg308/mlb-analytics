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
CREATE TABLE "PlayerGameBattingStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "flyOuts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "groundIntoDoublePlay" INTEGER NOT NULL,
    "groundIntoTriplePlay" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "totalBases" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "leftOnBase" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "PlayerGameBattingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGamePitchingStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "decision" "PitcherDecision",
    "summary" TEXT NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "gamesStarted" INTEGER NOT NULL,
    "flyouts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "numberOfPitches" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "saveOpporunities" INTEGER NOT NULL,
    "holds" INTEGER NOT NULL,
    "blownSaves" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "battersFaced" INTEGER NOT NULL,
    "outs" INTEGER NOT NULL,
    "completeGames" INTEGER NOT NULL,
    "shutouts" INTEGER NOT NULL,
    "pitchesThrown" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL,
    "hitBatsmen" INTEGER NOT NULL,
    "balks" INTEGER NOT NULL,
    "wildPitches" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "gamesFinished" INTEGER NOT NULL,
    "inheritedRunners" INTEGER NOT NULL,
    "inheritedRunnersScored" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "PlayerGamePitchingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonBattingStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "flyOuts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "groundIntoDoublePlay" INTEGER NOT NULL,
    "groundIntoTriplePlay" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "totalBases" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "leftOnBase" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "PlayerSeasonBattingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonPitchingStats" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "gamesStarted" INTEGER NOT NULL,
    "flyouts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "numberOfPitches" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "saveOpporunities" INTEGER NOT NULL,
    "holds" INTEGER NOT NULL,
    "blownSaves" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "battersFaced" INTEGER NOT NULL,
    "outs" INTEGER NOT NULL,
    "completeGames" INTEGER NOT NULL,
    "shutouts" INTEGER NOT NULL,
    "pitchesThrown" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL,
    "hitBatsmen" INTEGER NOT NULL,
    "balks" INTEGER NOT NULL,
    "wildPitches" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "gamesFinished" INTEGER NOT NULL,
    "inheritedRunners" INTEGER NOT NULL,
    "inheritedRunnersScored" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "PlayerSeasonPitchingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameBattingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "flyOuts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "groundIntoDoublePlay" INTEGER NOT NULL,
    "groundIntoTriplePlay" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "totalBases" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "leftOnBase" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "TeamGameBattingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGamePitchingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "flyouts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "numberOfPitches" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION NOT NULL,
    "saveOpporunities" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "battersFaced" INTEGER NOT NULL,
    "outs" INTEGER NOT NULL,
    "completeGames" INTEGER NOT NULL,
    "shutouts" INTEGER NOT NULL,
    "pitchesThrown" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL,
    "hitBatsmen" INTEGER NOT NULL,
    "balks" INTEGER NOT NULL,
    "wildPitches" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "inheritedRunners" INTEGER NOT NULL,
    "inheritedRunnersScored" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "TeamGamePitchingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameFieldingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "putOuts" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "chances" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "pickOffs" INTEGER NOT NULL,

    CONSTRAINT "TeamGameFieldingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonBattingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "flyOuts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "groundIntoDoublePlay" INTEGER NOT NULL,
    "groundIntoTriplePlay" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "totalBases" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "leftOnBase" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "TeamSeasonBattingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonPitchingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "flyouts" INTEGER NOT NULL,
    "groundOuts" INTEGER NOT NULL,
    "airOuts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "strikeOuts" INTEGER NOT NULL,
    "baseOnBalls" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "numberOfPitches" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION NOT NULL,
    "saveOpporunities" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "battersFaced" INTEGER NOT NULL,
    "outs" INTEGER NOT NULL,
    "completeGames" INTEGER NOT NULL,
    "shutouts" INTEGER NOT NULL,
    "pitchesThrown" INTEGER NOT NULL,
    "balls" INTEGER NOT NULL,
    "strikes" INTEGER NOT NULL,
    "hitBatsmen" INTEGER NOT NULL,
    "balks" INTEGER NOT NULL,
    "wildPitches" INTEGER NOT NULL,
    "pickoffs" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "inheritedRunners" INTEGER NOT NULL,
    "inheritedRunnersScored" INTEGER NOT NULL,
    "catchersInterference" INTEGER NOT NULL,
    "sacBunts" INTEGER NOT NULL,
    "sacFlies" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "popOuts" INTEGER NOT NULL,
    "lineOuts" INTEGER NOT NULL,

    CONSTRAINT "TeamSeasonPitchingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonFieldingStats" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "putOuts" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "chances" INTEGER NOT NULL,
    "passedBall" INTEGER NOT NULL,
    "pickOffs" INTEGER NOT NULL,

    CONSTRAINT "TeamSeasonFieldingStats_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Weather" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "lowTemperature" INTEGER,
    "highTemperature" INTEGER,
    "condition" VARCHAR(100),
    "windSpeed" INTEGER,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InningDetails" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "awayRuns" INTEGER NOT NULL,
    "homeHits" INTEGER NOT NULL,
    "awayHits" INTEGER NOT NULL,
    "homeErrors" INTEGER NOT NULL,
    "awayErrors" INTEGER NOT NULL,
    "homeLeftOn" INTEGER NOT NULL,
    "awayLeftOn" INTEGER NOT NULL,

    CONSTRAINT "InningDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRecord" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "homeWins" INTEGER NOT NULL,
    "homeLosses" INTEGER NOT NULL,
    "awayWins" INTEGER NOT NULL,
    "awayLosses" INTEGER NOT NULL,

    CONSTRAINT "TeamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamELO" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "elo" DECIMAL(65,30) NOT NULL,
    "eloChange" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TeamELO_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "PlayerGameBattingStats_playerId_idx" ON "PlayerGameBattingStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerGameBattingStats_gameId_idx" ON "PlayerGameBattingStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameBattingStats_playerId_gameId_key" ON "PlayerGameBattingStats"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "PlayerGamePitchingStats_playerId_idx" ON "PlayerGamePitchingStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerGamePitchingStats_gameId_idx" ON "PlayerGamePitchingStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGamePitchingStats_playerId_gameId_key" ON "PlayerGamePitchingStats"("playerId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonBattingStats_playerId_key" ON "PlayerSeasonBattingStats"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonBattingStats_seasonId_key" ON "PlayerSeasonBattingStats"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonBattingStats_playerId_idx" ON "PlayerSeasonBattingStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerSeasonBattingStats_seasonId_idx" ON "PlayerSeasonBattingStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonBattingStats_playerId_seasonId_key" ON "PlayerSeasonBattingStats"("playerId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonPitchingStats_playerId_key" ON "PlayerSeasonPitchingStats"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonPitchingStats_seasonId_key" ON "PlayerSeasonPitchingStats"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonPitchingStats_playerId_idx" ON "PlayerSeasonPitchingStats"("playerId");

-- CreateIndex
CREATE INDEX "PlayerSeasonPitchingStats_seasonId_idx" ON "PlayerSeasonPitchingStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonPitchingStats_playerId_seasonId_key" ON "PlayerSeasonPitchingStats"("playerId", "seasonId");

-- CreateIndex
CREATE INDEX "TeamGameBattingStats_teamId_idx" ON "TeamGameBattingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamGameBattingStats_gameId_idx" ON "TeamGameBattingStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameBattingStats_teamId_gameId_key" ON "TeamGameBattingStats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamGamePitchingStats_teamId_idx" ON "TeamGamePitchingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamGamePitchingStats_gameId_idx" ON "TeamGamePitchingStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGamePitchingStats_teamId_gameId_key" ON "TeamGamePitchingStats"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamGameFieldingStats_teamId_idx" ON "TeamGameFieldingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamGameFieldingStats_gameId_idx" ON "TeamGameFieldingStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameFieldingStats_teamId_gameId_key" ON "TeamGameFieldingStats"("teamId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonBattingStats_teamId_key" ON "TeamSeasonBattingStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonBattingStats_seasonId_key" ON "TeamSeasonBattingStats"("seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonBattingStats_teamId_idx" ON "TeamSeasonBattingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamSeasonBattingStats_seasonId_idx" ON "TeamSeasonBattingStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonBattingStats_teamId_seasonId_key" ON "TeamSeasonBattingStats"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonPitchingStats_teamId_key" ON "TeamSeasonPitchingStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonPitchingStats_seasonId_key" ON "TeamSeasonPitchingStats"("seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonPitchingStats_teamId_idx" ON "TeamSeasonPitchingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamSeasonPitchingStats_seasonId_idx" ON "TeamSeasonPitchingStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonPitchingStats_teamId_seasonId_key" ON "TeamSeasonPitchingStats"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonFieldingStats_teamId_key" ON "TeamSeasonFieldingStats"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonFieldingStats_seasonId_key" ON "TeamSeasonFieldingStats"("seasonId");

-- CreateIndex
CREATE INDEX "TeamSeasonFieldingStats_teamId_idx" ON "TeamSeasonFieldingStats"("teamId");

-- CreateIndex
CREATE INDEX "TeamSeasonFieldingStats_seasonId_idx" ON "TeamSeasonFieldingStats"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonFieldingStats_teamId_seasonId_key" ON "TeamSeasonFieldingStats"("teamId", "seasonId");

-- CreateIndex
CREATE INDEX "Injury_playerId_idx" ON "Injury"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_mlb_api_id_key" ON "Venue"("mlb_api_id");

-- CreateIndex
CREATE UNIQUE INDEX "Weather_gameId_key" ON "Weather"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "InningDetails_gameId_inning_key" ON "InningDetails"("gameId", "inning");

-- CreateIndex
CREATE INDEX "TeamRecord_seasonId_teamId_gameId_idx" ON "TeamRecord"("seasonId", "teamId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRecord_teamId_gameId_key" ON "TeamRecord"("teamId", "gameId");

-- CreateIndex
CREATE INDEX "TeamELO_seasonId_teamId_gameId_idx" ON "TeamELO"("seasonId", "teamId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamELO_teamId_gameId_key" ON "TeamELO"("teamId", "gameId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameBattingStats" ADD CONSTRAINT "PlayerGameBattingStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameBattingStats" ADD CONSTRAINT "PlayerGameBattingStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGamePitchingStats" ADD CONSTRAINT "PlayerGamePitchingStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGamePitchingStats" ADD CONSTRAINT "PlayerGamePitchingStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonBattingStats" ADD CONSTRAINT "PlayerSeasonBattingStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonPitchingStats" ADD CONSTRAINT "PlayerSeasonPitchingStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameBattingStats" ADD CONSTRAINT "TeamGameBattingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameBattingStats" ADD CONSTRAINT "TeamGameBattingStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGamePitchingStats" ADD CONSTRAINT "TeamGamePitchingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGamePitchingStats" ADD CONSTRAINT "TeamGamePitchingStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameFieldingStats" ADD CONSTRAINT "TeamGameFieldingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameFieldingStats" ADD CONSTRAINT "TeamGameFieldingStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonBattingStats" ADD CONSTRAINT "TeamSeasonBattingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonPitchingStats" ADD CONSTRAINT "TeamSeasonPitchingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonFieldingStats" ADD CONSTRAINT "TeamSeasonFieldingStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weather" ADD CONSTRAINT "Weather_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InningDetails" ADD CONSTRAINT "InningDetails_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecord" ADD CONSTRAINT "TeamRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamELO" ADD CONSTRAINT "TeamELO_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamELO" ADD CONSTRAINT "TeamELO_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamELO" ADD CONSTRAINT "TeamELO_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
