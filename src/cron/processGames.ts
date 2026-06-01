import { DateTime } from "luxon";
import { getGameResults, prisma } from "./processGameDay";

export async function runProcessGames() {
    const today = DateTime.now().setZone("America/Denver").toFormat("yyyy-MM-dd");
    try {
        await getGameResults(today);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    runProcessGames();
}
