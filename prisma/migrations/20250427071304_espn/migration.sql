/*
  Warnings:

  - A unique constraint covering the columns `[espn_api_id]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "espn_api_id" INTEGER;

-- CreateTable
CREATE TABLE "GameOdds" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "homeMoneyline" TEXT NOT NULL,
    "awayMoneyline" TEXT NOT NULL,
    "runTotal" DOUBLE PRECISION NOT NULL,
    "overOdds" DOUBLE PRECISION NOT NULL,
    "underOdds" DOUBLE PRECISION NOT NULL,
    "homeSpread" DOUBLE PRECISION NOT NULL,
    "awaySpread" DOUBLE PRECISION NOT NULL,
    "homeSpreadOdds" DOUBLE PRECISION NOT NULL,
    "awaySpreadOdds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameOdds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameOdds_gameId_key" ON "GameOdds"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_espn_api_id_key" ON "Game"("espn_api_id");

-- AddForeignKey
ALTER TABLE "GameOdds" ADD CONSTRAINT "GameOdds_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
