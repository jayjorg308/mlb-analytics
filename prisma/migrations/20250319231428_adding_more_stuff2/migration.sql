/*
  Warnings:

  - A unique constraint covering the columns `[abbreviation,sport]` on the table `positions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "positions_abbreviation_sport_key" ON "positions"("abbreviation", "sport");
