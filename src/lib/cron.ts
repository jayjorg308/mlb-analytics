import { DateTime } from "luxon";
import cron from "node-cron";

const safeRun = async (name: string, fn: () => Promise<void>) => {
    try {
        console.log(`[cron] ${name} starting at ${new Date().toISOString()}`);
        await fn();
        console.log(`[cron] ${name} completed at ${new Date().toISOString()}`);
    } catch (error) {
        console.error(`[cron] ${name} failed:`, error);
    }
};

let processGamesRunning = false;

const processGamesWithLock = async (name: string, date?: string) => {
    if (processGamesRunning) {
        console.log(`[cron] ${name} skipped: previous process-games run still in progress`);
        return;
    }
    processGamesRunning = true;
    try {
        await safeRun(name, async () => {
            const { runProcessGames } = await import("@/cron/processGames");
            await runProcessGames(date);
        });
    } finally {
        processGamesRunning = false;
    }
};

// IN-DAY: Update lineups and starting pitchers
// Every 30 minutes from 10 AM to 9 PM Mountain Time
cron.schedule(
    "*/30 10-21 * * *",
    async () => {
        await safeRun("fetch-lineups-and-pitchers", async () => {
            const { updateLineupsAndPitchers } = await import("@/cron/fetchLineupsAndPitchers");
            await updateLineupsAndPitchers();
        });
    },
    {
        timezone: "America/Denver",
    },
);

// END-OF-DAY: Process completed games
// Every 30 minutes from 9 PM to midnight Mountain Time (catches finishing games)
cron.schedule(
    "*/30 21-23 * * *",
    () => processGamesWithLock("process-games"),
    {
        timezone: "America/Denver",
    },
);

// END-OF-DAY: Final sweep at 1 AM MT to catch any late West Coast games.
// Targets yesterday's date because at 01:00 MT "today" in Denver is the new calendar day.
cron.schedule(
    "0 1 * * *",
    () => {
        const yesterday = DateTime.now().setZone("America/Denver").minus({ days: 1 }).toFormat("yyyy-MM-dd");
        return processGamesWithLock("process-games-final-sweep", yesterday);
    },
    {
        timezone: "America/Denver",
    },
);

console.log("[cron] Scheduler initialized");
