import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 2025 starting ELOs for teams
const teamELO = [
    { teamId: 1, elo: 1470.327397 },
    { teamId: 2, elo: 1485.688335 },
    { teamId: 3, elo: 1538.419729 },
    { teamId: 4, elo: 1524.959085 },
    { teamId: 5, elo: 1506.083977 },
    { teamId: 6, elo: 1501.625102 },
    { teamId: 7, elo: 1508.522741 },
    { teamId: 8, elo: 1498.125847 },
    { teamId: 9, elo: 1494.212134 },
    { teamId: 10, elo: 1496.17205 },
    { teamId: 11, elo: 1523.568945 },
    { teamId: 12, elo: 1529.325583 },
    { teamId: 13, elo: 1430.852045 },
    { teamId: 14, elo: 1471.801353 },
    { teamId: 15, elo: 1531.704017 },
    { teamId: 16, elo: 1530.888465 },
    { teamId: 17, elo: 1457.83941 },
    { teamId: 18, elo: 1530.547298 },
    { teamId: 19, elo: 1515.177857 },
    { teamId: 20, elo: 1500.016918 },
    { teamId: 21, elo: 1520.828299 },
    { teamId: 22, elo: 1497.586195 },
    { teamId: 23, elo: 1513.221695 },
    { teamId: 24, elo: 1455.529991 },
    { teamId: 25, elo: 1515.664248 },
    { teamId: 26, elo: 1528.742317 },
    { teamId: 27, elo: 1509.382757 },
    { teamId: 28, elo: 1556.838102 },
    { teamId: 29, elo: 1476.838099 },
    { teamId: 30, elo: 1529.507817 },
];

async function seedTeamELO() {
    try {
        // get teams from db
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            const elo = teamELO.find((t) => t.teamId === team.id)?.elo || null;

            if (!elo) {
                console.log(`No ELO found for team ${team.name}`);
                continue;
            }
            // Insert player into the database
            await prisma.teamELO.create({
                data: {
                    teamId: team.id,
                    seasonId: 1,
                    elo: elo,
                    eloChange: 0,
                },
            });

            console.log(`Seeded game ELO for team ${team.name}`);
        }

        console.log("✅ Finished seeding Team ELOs.");
    } catch (error) {
        console.error("❌ Error seeding Team ELOs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTeamELO();
