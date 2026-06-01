import { DateTime } from "luxon";
import { getGameResults, prisma } from "./processGameDay";

export async function runProcessGames(date?: string) {
    const targetDate = date ?? DateTime.now().setZone("America/Denver").toFormat("yyyy-MM-dd");
    await getGameResults(targetDate);
}

if (require.main === module) {
    runProcessGames().finally(() => prisma.$disconnect());
}
