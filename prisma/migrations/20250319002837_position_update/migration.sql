/*
  Warnings:

  - Added the required column `abbreviation` to the `positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "abbreviation" VARCHAR(10) NOT NULL,
ADD COLUMN     "pos_number" INTEGER;
