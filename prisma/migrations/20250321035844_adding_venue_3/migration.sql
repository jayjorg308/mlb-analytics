/*
  Warnings:

  - You are about to drop the column `teamId` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the `_TeamToVenue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TeamToVenue" DROP CONSTRAINT "_TeamToVenue_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToVenue" DROP CONSTRAINT "_TeamToVenue_B_fkey";

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "teamId";

-- DropTable
DROP TABLE "_TeamToVenue";

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
