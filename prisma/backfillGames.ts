import { DateTime } from "luxon";
import { getGameResults, prisma } from "../src/cron/processGameDay";

// Inclusive on both ends. Override via CLI:
//   npx ts-node prisma/backfillGames.ts 2026-03-25 2026-05-28
const DEFAULT_START = "2026-03-25";
const DEFAULT_END = DateTime.now().setZone("America/Denver").minus({ days: 1 }).toFormat("yyyy-MM-dd");

async function backfill(startDate: string, endDate: string) {
    const start = DateTime.fromISO(startDate, { zone: "America/Denver" });
    const end = DateTime.fromISO(endDate, { zone: "America/Denver" });

    if (!start.isValid || !end.isValid) {
        console.error(`Invalid date(s): start=${startDate}, end=${endDate}`);
        return;
    }

    if (end < start) {
        console.error(`End date ${endDate} is before start date ${startDate}.`);
        return;
    }

    const totalDays = Math.floor(end.diff(start, "days").days) + 1;
    console.log(`Backfilling ${totalDays} days: ${startDate} → ${endDate}`);

    let current = start;
    let dayIndex = 0;
    while (current <= end) {
        const date = current.toFormat("yyyy-MM-dd");
        dayIndex++;
        console.log(`\n=== Day ${dayIndex}/${totalDays}: ${date} ===`);
        try {
            await getGameResults(date);
        } catch (error) {
            console.error(`Error backfilling ${date}:`, error);
        }
        current = current.plus({ days: 1 });
    }

    console.log(`\n✅ Backfill complete: ${startDate} → ${endDate}`);
}

async function main() {
    const [, , startArg, endArg] = process.argv;
    const startDate = startArg ?? DEFAULT_START;
    const endDate = endArg ?? DEFAULT_END;

    try {
        await backfill(startDate, endDate);
    } finally {
        await prisma.$disconnect();
    }
}

main();
