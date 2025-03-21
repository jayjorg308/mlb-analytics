import { GameStatus, PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function updateGame(gamePk: number) {
    try {
        const { data } = await axios.get(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);

        const gameData = data.gameData;
        const liveData = data.liveData;
        const gameStatus = gameData.status.detailedState; // e.g., "Final"
        const isFinal = gameStatus.toLowerCase().includes("final");

        const homeTeamId = gameData.teams.home.id;
        const awayTeamId = gameData.teams.away.id;
        const homeScore = liveData.linescore.teams.home.runs;
        const awayScore = liveData.linescore.teams.away.runs;

        const winningTeamId = homeScore > awayScore ? homeTeamId : awayTeamId;

        // Find internal team IDs based on mlb_api_id
        const homeTeam = await prisma.team.findUnique({ where: { mlb_api_id: homeTeamId } });
        const awayTeam = await prisma.team.findUnique({ where: { mlb_api_id: awayTeamId } });
        const venue = await prisma.venue.findUnique({
            where: { mlb_api_id: gameData.venue.id },
            include: { Team: true },
        });
        const isNeutralSite = venue && venue.Team[0] == null;

        if (!homeTeam || !awayTeam) {
            throw new Error("Home or Away team not found in DB");
        }

        // Update the Game record
        await prisma.game.update({
            where: { mlb_api_id: gamePk },
            data: {
                game_status: isFinal ? GameStatus.FINAL : GameStatus.IN_PROGRESS,
                home_score: homeScore,
                away_score: awayScore,
                winner_team_id: winningTeamId === homeTeamId ? homeTeam.id : awayTeam.id,
                is_neutral_site: isNeutralSite ?? false,
            },
        });

        console.log(`Updated game ${gamePk} with final score ${homeScore}-${awayScore}`);

        // --- Optionally handle TeamStats & PlayerStats here ---
    } catch (error) {
        console.error(`Error updating game ${gamePk}:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

// Test run with 778563
updateGame(778563);
