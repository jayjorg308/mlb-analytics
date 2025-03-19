/*
  Warnings:

  - A unique constraint covering the columns `[mlb_api_id]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `photoUrl` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "photoUrl" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "teams_mlb_api_id_key" ON "teams"("mlb_api_id");
