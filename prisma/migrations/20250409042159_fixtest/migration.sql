-- DropIndex
DROP INDEX "PlayerSeasonBattingStats_playerId_key";

-- DropIndex
DROP INDEX "PlayerSeasonPitchingStats_playerId_key";

-- DropIndex
DROP INDEX "TeamSeasonBattingStats_seasonId_key";

-- DropIndex
DROP INDEX "TeamSeasonBattingStats_teamId_key";

-- DropIndex
DROP INDEX "TeamSeasonFieldingStats_seasonId_key";

-- DropIndex
DROP INDEX "TeamSeasonFieldingStats_teamId_key";

-- DropIndex
DROP INDEX "TeamSeasonPitchingStats_seasonId_key";

-- DropIndex
DROP INDEX "TeamSeasonPitchingStats_teamId_key";

-- AddForeignKey
ALTER TABLE "PlayerSeasonBattingStats" ADD CONSTRAINT "PlayerSeasonBattingStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonPitchingStats" ADD CONSTRAINT "PlayerSeasonPitchingStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonBattingStats" ADD CONSTRAINT "TeamSeasonBattingStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonPitchingStats" ADD CONSTRAINT "TeamSeasonPitchingStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonFieldingStats" ADD CONSTRAINT "TeamSeasonFieldingStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
