import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function seedVenues() {
    try {
        // Fetch MLB schedule from the API
        const { data } = await axios.get(
            "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-03-25&endDate=2026-09-27&season=2026&gameType=R",
        );

        // get unique venues from the schedule
        const venues: number[] = [];
        for (const dateEntry of data.dates) {
            for (const game of dateEntry.games) {
                const { venue } = game;
                if (!venues.includes(venue.id)) venues.push(venue.id as number);
            }
        }

        for (const venue of venues) {
            const { data } = await axios.get(`https://statsapi.mlb.com/api/v1/venues/${venue}`);
            const { id, name } = data.venues[0];

            // Insert Venue into the database
            await prisma.venue.create({
                data: {
                    mlb_api_id: id,
                    name: name,
                    isIndoor: false, // Set based on special cases if needed
                    latitude: 0.0,
                    longitude: 0.0,
                    address: "",
                    city: "",
                    state: "",
                    country: "",
                },
            });

            console.log(`Seeded venue ${name}`);
        }

        console.log("✅ Finished seeding MLB venues.");
    } catch (error) {
        console.error("❌ Error seeding venues:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedVenues();
