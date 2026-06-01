export async function register() {
    console.log("[instrumentation] register() called");

    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[instrumentation] nodejs runtime detected, loading cron");
        try {
            await import("./lib/cron");
            console.log("[instrumentation] cron module imported successfully");
        } catch (error) {
            console.error("[instrumentation] failed to import cron:", error);
        }
    } else {
        console.log("[instrumentation] runtime is:", process.env.NEXT_RUNTIME);
    }
}
