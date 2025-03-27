// import { PrismaClient, GameStatus } from "@prisma/client";
// import axios from "axios";

// const prisma = new PrismaClient();

// const mapStatus = (statusCode: string): GameStatus => {
//     switch (statusCode) {
//         case "S":
//             return GameStatus.SCHEDULED;
//         case "P":
//             return GameStatus.POSTPONED;
//         case "F":
//             return GameStatus.FINAL;
//         default:
//             return GameStatus.SCHEDULED;
//     }
// };

// async function updateGameParticipants(gameId: number) {
//     try {
//         // Fetch MLB schedule from the API
//         const { data } = await axios.get(`https://statsapi.mlb.com/api/v1/game/${gameId}/boxscore`);

//         console.log(`Seeded game ${gameId}`);

//         console.log("✅ Finished seeding MLB regular season schedule.");
//     } catch (error) {
//         console.error("❌ Error seeding games:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// // 778563

// // 778564

// const gameId = 778564;
// updateGameParticipants(gameId);
