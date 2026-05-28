import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function seedGames() {
    try {
        // Fetch MLB schedule from the API
        const { data } = await axios.get(
            "https://statsapi.mlb.com/api/v1/teams?sportId=1", // Replace with the correct API endpoint for the schedule
        );

        const teams = data.teams;
        for (const team of teams) {
            const { id, venue, abbreviation, clubName, franchiseName } = team;

            // Find the venue in the database
            const dbVenue = await prisma.venue.findUnique({ where: { mlb_api_id: venue.id } });

            // Insert team into the database
            await prisma.team.create({
                data: {
                    mlb_api_id: id,
                    city: franchiseName,
                    name: clubName,
                    abbreviation: abbreviation,
                    logo_url: ``,
                    venue_id: dbVenue?.id,
                },
            });

            console.log(`Seeded team ${clubName}`);
        }

        console.log("✅ Finished seeding MLB teams.");
    } catch (error) {
        console.error("❌ Error seeding teams:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedGames();
