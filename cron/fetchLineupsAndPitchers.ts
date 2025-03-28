import { PrismaClient } from "@prisma/client";
import axios from "axios";

interface Player {
    id: number;
}

const prisma = new PrismaClient();

// Function to map MLB API IDs to internal Player IDs
const mapMlbApiIdsToPlayerIds = async (mlbApiIds: number[]): Promise<Record<number, number>> => {
    const players = await prisma.player.findMany({
        where: { mlb_api_id: { in: mlbApiIds } },
        select: { id: true, mlb_api_id: true },
    });

    return Object.fromEntries(players.map((player) => [player.mlb_api_id, player.id]));
};

async function updateLineupsAndPitchers() {
    try {
        const today = new Date().toLocaleDateString();
        const { data } = await axios.get(
            `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,lineups&startDate=${today}&endDate=${today}&gameType=R`,
        );

        const { dates } = data;
        if (!dates || dates.length === 0) return;

        const games = dates[0].games;
        if (!games || games.length === 0) return;

        for (const game of games) {
            // Check if game exists
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });

            if (!existingGame) continue;

            const homePitcherApiId = game.teams.home.probablePitcher?.id;
            const awayPitcherApiId = game.teams.away.probablePitcher?.id;

            // Collect all player IDs for batch query
            const playerApiIds: number[] = [];
            if (homePitcherApiId) playerApiIds.push(homePitcherApiId);
            if (awayPitcherApiId) playerApiIds.push(awayPitcherApiId);

            if (game.lineups?.homePlayers) {
                playerApiIds.push(...game.lineups.homePlayers.map((player: Player) => player.id));
            }
            if (game.lineups?.awayPlayers) {
                playerApiIds.push(...game.lineups.awayPlayers.map((player: Player) => player.id));
            }

            // Map MLB API IDs to internal player IDs
            const playerIdMap = await mapMlbApiIdsToPlayerIds(playerApiIds);

            // Assign pitchers
            const homePitcherId = playerIdMap[homePitcherApiId!] || null;
            const awayPitcherId = playerIdMap[awayPitcherApiId!] || null;

            // Assign batting orders
            const homeBattingOrder: number[] = game.lineups?.homePlayers
                ? game.lineups.homePlayers
                      .map((player: Player) => playerIdMap[player.id] || null)
                      .filter((id: number | null): id is number => id !== null)
                : [];
            const awayBattingOrder: number[] = game.lineups?.awayPlayers
                ? game.lineups.awayPlayers
                      .map((player: Player) => playerIdMap[player.id] || null)
                      .filter((id: number | null): id is number => id !== null)
                : [];

            // Update game
            await prisma.game.update({
                where: { mlb_api_id: game.gamePk },
                data: {
                    startingPitcherHomeId: homePitcherId,
                    startingPitcherAwayId: awayPitcherId,
                    battingOrderHome: homeBattingOrder,
                    battingOrderAway: awayBattingOrder,
                },
            });

            console.log(`Updated game ${game.gamePk} with pitchers ${homePitcherId} and ${awayPitcherId}`);
        }
    } catch (error) {
        console.error("Error updating probable pitchers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateLineupsAndPitchers();
