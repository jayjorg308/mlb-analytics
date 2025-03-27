import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function setProbablePitchers(startDate: string, endDate: string) {
    try {
        // Fetch MLB schedule from the API
        const { data } = await axios.get(
            `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher&startDate=${startDate}&endDate=${endDate}&gameType=R`,
        );

        const { dates } = data;
        if (!dates || dates.length === 0) return;

        const games = dates[0].games;
        if (!games || games.length === 0) return;

        for (const game of games) {
            // see if the game already exists in the database
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });

            if (!existingGame) continue;

            const homePitcherApiId = game.teams.home.probablePitcher?.id;
            const awayPitcherApiId = game.teams.away.probablePitcher?.id;

            // get pitchers from player table
            let homePitcher = null;
            let awayPitcher = null;

            if (homePitcherApiId && homePitcherApiId !== undefined) {
                homePitcher = await prisma.player.findUnique({
                    where: { mlb_api_id: homePitcherApiId },
                });
            }

            if (awayPitcherApiId && awayPitcherApiId !== undefined) {
                awayPitcher = await prisma.player.findUnique({
                    where: { mlb_api_id: awayPitcherApiId },
                });
            }

            // update the game with the probable pitchers
            await prisma.game.update({
                where: { mlb_api_id: game.gamePk },
                data: {
                    startingPitcherHomeId: homePitcher ? homePitcher.id : null,
                    startingPitcherAwayId: awayPitcher ? awayPitcher.id : null,
                },
            });

            console.log(`Added pitchers: ${homePitcher?.id} and ${awayPitcher?.id} to game: ${game.gamePk}`);
        }

        console.log("✅ Finished adding probable pitchers.");
    } catch (error) {
        console.error("❌ Error settomg probable pitchers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

setProbablePitchers("2025-03-28", "2025-03-28");
