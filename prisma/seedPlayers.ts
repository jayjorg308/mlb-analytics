import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

function splitName(fullName: string): { firstName: string; lastName: string } {
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" "); // Join remaining parts as lastName

    return {
        firstName,
        lastName,
    };
}

async function seedPlayers() {
    try {
        // get teams from db
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            // Fetch 40 man roster from the API
            const { data } = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${team.mlb_api_id}/roster/40Man`);

            for (const player of data.roster) {
                const { person, jerseyNumber, position } = player;

                const { firstName, lastName } = splitName(person.fullName);

                const existingPlayer = await prisma.player.findUnique({
                    where: {
                        mlb_api_id: person.id,
                    },
                });

                if (existingPlayer) {
                    console.log(`Player ${person.fullName} already exists. Skipping...`);
                    continue;
                }

                // Insert player into the database
                await prisma.player.create({
                    data: {
                        mlb_api_id: person.id,
                        firstName: firstName,
                        lastName: lastName,
                        position: position.abbreviation,
                        uniformNumber: parseInt(jerseyNumber as string),
                        teamId: team.id,
                        photoUrl: `https://media.gamblersanonymo.us/mlb/players/${person.id}.jpg`,
                    },
                });

                console.log(`Seeded player ${person.fullName} for team ${team.name}`);
            }
        }

        console.log("✅ Finished seeding MLB players.");
    } catch (error) {
        console.error("❌ Error seeding players:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedPlayers();
