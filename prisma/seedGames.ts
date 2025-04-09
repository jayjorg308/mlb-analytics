import { PrismaClient, GameStatus } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function seedGames() {
    try {
        // Fetch MLB schedule from the API
        const { data } = await axios.get(
            "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2025-03-18&endDate=2025-09-28&season=2025&gameType=R",
        );

        const dates = data.dates;
        for (const dateEntry of dates) {
            for (const game of dateEntry.games) {
                const { gamePk, gameDate, teams, venue } = game;

                // Get mlb_api_ids
                const homeTeamApiId = teams.home.team.id;
                const awayTeamApiId = teams.away.team.id;
                const venueApiId = venue?.id;

                // Lookup corresponding DB IDs
                const homeTeam = await prisma.team.findUnique({
                    where: { mlb_api_id: homeTeamApiId },
                });

                const awayTeam = await prisma.team.findUnique({
                    where: { mlb_api_id: awayTeamApiId },
                });

                const venueRecord = await prisma.venue.findUnique({
                    where: { mlb_api_id: venueApiId },
                });

                if (!homeTeam || !awayTeam || !venueRecord) {
                    console.warn(`Skipping game ${gamePk} due to missing team or venue.`);
                    continue;
                }

                // Insert game into the database
                await prisma.game.create({
                    data: {
                        mlb_api_id: gamePk,
                        season_id: 1,
                        venue_id: venueRecord.id,
                        date: new Date(gameDate),
                        status: GameStatus.SCHEDULED,
                        homeTeamId: homeTeam.id,
                        awayTeamId: awayTeam.id,
                    },
                });

                console.log(`Seeded game ${gamePk}`);
            }
        }

        console.log("✅ Finished seeding MLB regular season schedule.");
    } catch (error) {
        console.error("❌ Error seeding games:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedGames();
