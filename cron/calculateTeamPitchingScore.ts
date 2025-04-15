import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// todo: fix individual player pitching score calculation on the season

async function calculateTeamPitchingScore() {
    try {
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            const pitchers = await prisma.player.findMany({
                where: {
                    teamId: team.id,
                    position: "P",
                },
            });

            const playerGamePitchingStats = await prisma.playerGamePitchingStats.findMany({
                where: {
                    playerId: { in: pitchers.map((pitcher) => pitcher.id) },
                    gamesStarted: 1,
                },
            });

            const averagePitchingScore =
                playerGamePitchingStats.reduce((acc, stats) => {
                    return acc + (stats.pitchingScore ?? 0.0);
                }, 0) / playerGamePitchingStats.length;

            console.log(playerGamePitchingStats.length, "playerGamePitchingStats");
            console.log(averagePitchingScore, "averagePitchingScore");
            console.log(`Updated team: ${team.name} pitching score`);
        }
    } catch (error) {
        console.error("Error updating team pitching scores:", error);
    } finally {
        await prisma.$disconnect();
    }
}

calculateTeamPitchingScore();
