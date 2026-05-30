import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const YEAR = 2026;
const START_DATE = new Date("2026-03-25");
const END_DATE = new Date("2026-09-27");

async function seedSeason() {
    try {
        const season = await prisma.season.upsert({
            where: { year: YEAR },
            update: {
                startDate: START_DATE,
                endDate: END_DATE,
            },
            create: {
                year: YEAR,
                startDate: START_DATE,
                endDate: END_DATE,
            },
        });

        console.log(`✅ Seeded Season ${season.year} with id ${season.id}.`);

        if (season.id !== 1) {
            console.warn(
                `⚠️ Season id is ${season.id}, but the rest of the seeds hard-code seasonId: 1. ` +
                    `Either reset the DB so this row lands at id=1, or patch the other seed files.`,
            );
        }
    } catch (error) {
        console.error("❌ Error seeding Season:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedSeason();
