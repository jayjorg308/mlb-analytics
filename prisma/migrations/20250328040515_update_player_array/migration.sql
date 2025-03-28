/*
  Warnings:

  - The `battingOrderHome` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `battingOrderAway` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "battingOrderHome",
ADD COLUMN     "battingOrderHome" INTEGER[],
DROP COLUMN "battingOrderAway",
ADD COLUMN     "battingOrderAway" INTEGER[];
