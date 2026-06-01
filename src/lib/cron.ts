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
    async () => {
        await safeRun("process-games", async () => {
            const { runProcessGames } = await import("@/cron/processGames");
            await runProcessGames();
        });
    },
    {
        timezone: "America/Denver",
    },
);

// END-OF-DAY: Final sweep at 1 AM MT to catch any late West Coast games
cron.schedule(
    "0 1 * * *",
    async () => {
        await safeRun("process-games-final-sweep", async () => {
            const { runProcessGames } = await import("@/cron/processGames");
            await runProcessGames();
        });
    },
    {
        timezone: "America/Denver",
    },
);

console.log("[cron] Scheduler initialized");
