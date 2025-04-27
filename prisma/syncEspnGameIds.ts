// import { PrismaClient } from "@prisma/client";
// import axios from "axios";
// import { subDays, format } from "date-fns";

// const prisma = new PrismaClient();

// async function syncEspnGameIds() {
//     try {
//         console.log("Starting ESPN ID Sync...");

//         // Fetch games for the past 7 days just in case
//         const startDate = format(subDays(new Date(), 7), "yyyyMMdd");
//         const endDate = format(new Date(), "yyyyMMdd");

//         const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${startDate}-${endDate}`;
//         const { data } = await axios.get(espnUrl);

//         const events = data.events as any[];

//         if (!events || events.length === 0) {
//             console.error("No ESPN events found.");
//             return;
//         }

//         console.log(`Found ${events.length} ESPN games.`);

//         // Fetch games from your database that don't have an espn_api_id yet
//         const games = await prisma.game.findMany({
//             where: {
//                 espn_api_id: null,
//             },
//             include: {
//                 homeTeam: true,
//                 awayTeam: true,
//             },
//         });

//         console.log(`Found ${games.length} games without ESPN ID.`);

//         let matched = 0;

//         for (const game of games) {
//             const gameDate = format(game.date, "yyyyMMdd");

//             const matchingEvent = events.find((event) => {
//                 const competition = event.competitions?.[0];
//                 if (!competition) return false;

//                 const eventDate = format(new Date(event.date), "yyyyMMdd");

//                 const homeTeam = competition.competitors.find((c: any) => c.homeAway === "home");
//                 const awayTeam = competition.competitors.find((c: any) => c.homeAway === "away");

//                 if (!homeTeam || !awayTeam) return false;

//                 return (
//                     eventDate === gameDate &&
//                     homeTeam.team.abbreviation === game.homeTeam.abbreviation &&
//                     awayTeam.team.abbreviation === game.awayTeam.abbreviation
//                 );
//             });

//             if (matchingEvent) {
//                 await prisma.game.update({
//                     where: { id: game.id },
//                     data: {
//                         espn_api_id: Number(matchingEvent.id),
//                     },
//                 });

//                 console.log(`✅ Updated Game ${game.id} with ESPN ID ${matchingEvent.id}`);
//                 matched++;
//             } else {
//                 console.warn(
//                     `⚠️ No match found for Game ${game.id} (${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation})`,
//                 );
//             }
//         }

//         console.log(`Finished: ${matched} games updated with ESPN IDs.`);
//     } catch (error) {
//         console.error("Error syncing ESPN game IDs:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// syncEspnGameIds();
