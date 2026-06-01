import { GameStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// todo: automate this after games are played

async function fixPitchingScores() {
    try {
        const teams = await prisma.team.findMany({
            include: {
                homeGames: {
                    where: {
                        status: GameStatus.FINAL,
                    },
                    include: {
                        PlayerGamePitchingStats: {
                            where: { gamesStarted: 1 },
                            include: {
                                player: true,
                            },
                        },
                    },
                },
                awayGames: {
                    where: {
                        status: GameStatus.FINAL,
                    },
                    include: {
                        PlayerGamePitchingStats: {
                            where: { gamesStarted: 1 },
                            include: {
                                player: true,
                            },
                        },
                    },
                },
            },
        });

        for (const team of teams) {
            const allGames = [...team.homeGames, ...team.awayGames];
            const totalPitchingScore = allGames.reduce((acc, game) => {
                const pitchingStats = game.PlayerGamePitchingStats.find((x) => x.player.teamId === team.id);
                return acc + (pitchingStats ? pitchingStats.pitchingScore ?? 0 : 0);
            }, 0);

            const gamesCount = allGames.length;
            const averagePitchingScore = gamesCount > 0 ? totalPitchingScore / gamesCount : 0;

            await prisma.teamSeasonPitchingStats.update({
                where: { teamId_seasonId: { teamId: team.id, seasonId: 1 } },
                data: {
                    teamPitchingScore: averagePitchingScore,
                },
            });

            console.log(
                `Team: ${team.name}, Games Played ${gamesCount}, Average Pitching Score: ${averagePitchingScore}`,
            );
        }
    } catch (error) {
        console.error("Error updating team pitching average:", error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    fixPitchingScores();
}
