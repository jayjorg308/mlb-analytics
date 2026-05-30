import { DateTime } from "luxon";
import { getGameResults, prisma } from "./processGameDay";

async function main() {
    const today = DateTime.now().setZone("America/Denver").toFormat("yyyy-MM-dd");
    try {
        await getGameResults(today);
    } finally {
        await prisma.$disconnect();
    }
}

main();
