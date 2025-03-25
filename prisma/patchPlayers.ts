// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// function migrateHeightFromOldFormat(oldHeight: number): number {
//     const feet = Math.floor(oldHeight / 100);
//     const inches = oldHeight % 100;
//     return feet * 12 + inches;
// }

// async function patchPlayers() {
//     const players = await prisma.player.findMany();

//     for (const player of players) {
//         // Fix height if stored as inches, convert to centimeters
//         const correctedHeight = player.height ? migrateHeightFromOldFormat(player.height) : player.height;

//         // Fetch fresh player data from MLB API to get useName
//         if (player.mlb_person_id) {
//             const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${player.mlb_person_id}`);
//             const data = await res.json();
//             const useName = data.people?.[0]?.useName;
//             const useLastName = data.people?.[0]?.useLastName;

//             await prisma.player.update({
//                 where: { id: player.id },
//                 data: {
//                     height: correctedHeight,
//                     firstName: useName || player.firstName, // fallback if useName missing
//                     lastName: useLastName || player.lastName, // fallback if useLastName missing
//                     photoUrl: `https://media.gamblersanonymo.us/mlb/players/${player.mlb_person_id}.jpg`,
//                     age: data.people?.[0]?.currentAge,
//                 },
//             });

//             console.log(`Updated player ${player.id}: height=${correctedHeight}, firstName=${useName}`);
//         }
//     }

//     await prisma.$disconnect();
// }

// patchPlayers().catch((e) => {
//     console.error(e);
//     prisma.$disconnect();
// });
