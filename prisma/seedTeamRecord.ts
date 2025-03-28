import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTeamRecords() {
    try {
        // get teams from db
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            // get all games for team from database
            const games = await prisma.game.findMany({
                where: {
                    OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
                },
            });

            for (const game of games) {
                await prisma.teamRecord.create({
                    data: {
                        gameId: game.id,
                        teamId: team.id,
                        seasonId: 1,
                        wins: 0,
                        losses: 0,
                        homeWins: 0,
                        homeLosses: 0,
                        awayWins: 0,
                        awayLosses: 0,
                    },
                });

                console.log(`Seeded game record for team ${team.name} in game ${game.id}`);
            }
        }

        console.log("✅ Finished seeding Team Records.");
    } catch (error) {
        console.error("❌ Error seeding Team Records:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTeamRecords();
