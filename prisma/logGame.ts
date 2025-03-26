import { PrismaClient, GameStatus } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const mapStatus = (statusCode: string): GameStatus => {
    switch (statusCode) {
        case "S":
            return GameStatus.SCHEDULED;
        case "F":
            return GameStatus.FINAL;
        default:
            return GameStatus.SCHEDULED;
    }
};

async function logGame(gameId: number) {
    try {
        // Fetch MLB schedule from the API
        const { data } = await axios.get(`https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`);
        const { gameData, liveData } = data;

        // Get mlb_api_ids
        const homeTeamApiId = gameData.teams.home.id;
        const awayTeamApiId = gameData.teams.away.id;

        // Lookup corresponding DB IDs
        const homeTeam = await prisma.team.findUnique({
            where: { mlb_api_id: homeTeamApiId },
        });

        const awayTeam = await prisma.team.findUnique({
            where: { mlb_api_id: awayTeamApiId },
        });

        const homeScore = liveData.boxscore.teams.home.teamStats.batting.runs;
        const awayScore = liveData.boxscore.teams.away.teamStats.batting.runs;

        // Update game in the database
        await prisma.game.update({
            where: { mlb_api_id: gameId },
            data: {
                status: mapStatus(gameData.status.statusCode),
                homeScore: homeScore,
                awayScore: awayScore,
                winningTeamId: homeScore > awayScore ? homeTeam?.id : awayTeam?.id,
            },
        });

        console.log(`Updated game ${gameId}`);

        console.log("✅ Finished logging game.");
    } catch (error) {
        console.error("❌ Error logging game:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// 778563

// 778564

const gameId = 778564;
logGame(gameId);
