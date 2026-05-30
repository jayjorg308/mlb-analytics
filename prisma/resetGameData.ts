import { GameStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetGameData() {
    try {
        console.log("Deleting per-game stats...");
        await prisma.playerGameBattingStats.deleteMany({});
        await prisma.playerGamePitchingStats.deleteMany({});
        await prisma.teamGameBattingStats.deleteMany({});
        await prisma.teamGamePitchingStats.deleteMany({});
        await prisma.teamGameFieldingStats.deleteMany({});
        await prisma.inningDetails.deleteMany({});

        console.log("Deleting per-season rollups...");
        await prisma.playerSeasonBattingStats.deleteMany({});
        await prisma.playerSeasonPitchingStats.deleteMany({});
        await prisma.teamSeasonBattingStats.deleteMany({});
        await prisma.teamSeasonPitchingStats.deleteMany({});
        await prisma.teamSeasonFieldingStats.deleteMany({});

        console.log("Resetting Game state to SCHEDULED...");
        await prisma.game.updateMany({
            data: {
                status: GameStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
                winningTeamId: null,
            },
        });

        console.log("Zeroing TeamRecord...");
        await prisma.teamRecord.updateMany({
            data: {
                wins: 0,
                losses: 0,
                homeWins: 0,
                homeLosses: 0,
                awayWins: 0,
                awayLosses: 0,
            },
        });

        console.log("Wiping TeamELO (re-run seedTeamElo.ts after this)...");
        await prisma.teamELO.deleteMany({});

        console.log(
            "✅ Reset complete. Next: npx ts-node prisma/seedTeamElo.ts, then npx ts-node prisma/backfillGames.ts",
        );
    } catch (error) {
        console.error("❌ Error resetting game data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetGameData();
