/*
  Warnings:

  - A unique constraint covering the columns `[mlb_person_id]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ThrowingHand" ADD VALUE 'SWITCH';

-- CreateIndex
CREATE UNIQUE INDEX "players_mlb_person_id_key" ON "players"("mlb_person_id");
