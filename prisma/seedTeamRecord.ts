import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTeamRecords() {
    try {
        // get teams from db
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            await prisma.teamRecord.create({
                data: {
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
        }

        console.log("✅ Finished seeding Team Records.");
    } catch (error) {
        console.error("❌ Error seeding Team Records:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTeamRecords();
