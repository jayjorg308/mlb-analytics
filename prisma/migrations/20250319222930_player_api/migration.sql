/*
  Warnings:

  - Added the required column `birthCity` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthCountry` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthState` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "birthCity" VARCHAR(100) NOT NULL,
ADD COLUMN     "birthCountry" VARCHAR(100) NOT NULL,
ADD COLUMN     "birthDate" DATE NOT NULL,
ADD COLUMN     "birthState" VARCHAR(100) NOT NULL,
ADD COLUMN     "debutDate" TIMESTAMP(3),
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "mlb_person_id" INTEGER,
ADD COLUMN     "weight" INTEGER;
