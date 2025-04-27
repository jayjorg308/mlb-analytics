// import axios from "axios";
// import { prisma } from "@/lib/prisma"; // or your Prisma client

// async function fetchAndStoreOdds() {
//     const today = new Date();
//     const formatted = today.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
//     // https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=YYYYMMDD
//     const { data } = await axios.get(
//         `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${formatted}`,
//     );

//     for (const event of data.events) {
//         const competition = event.competitions[0];
//         const odds = competition.odds?.[0];
//         if (!odds) continue;

//         const home = competition.competitors.find((c) => c.homeAway === "home");
//         const away = competition.competitors.find((c) => c.homeAway === "away");

//         if (!home || !away) continue;

//         const homeTeamAbbreviation = home.team.abbreviation;
//         const awayTeamAbbreviation = away.team.abbreviation;

//         // Example: Find your game's database record
//         const existingGame = await prisma.game.findFirst({
//             where: {
//                 homeTeam: { abbreviation: homeTeamAbbreviation },
//                 awayTeam: { abbreviation: awayTeamAbbreviation },
//                 date: {
//                     gte: new Date(today.setHours(0, 0, 0, 0)),
//                     lte: new Date(today.setHours(23, 59, 59, 999)),
//                 },
//             },
//         });

//         if (!existingGame) continue;

//         await prisma.gameOdds.upsert({
//             where: { gameId: existingGame.id },
//             update: {
//                 homeMoneyline: odds.homeTeamOdds.close.pointSpread.american,
//                 awayMoneyline: odds.awayTeamOdds.close.pointSpread.american,
//                 overUnder: parseFloat(odds.current.total.alternateDisplayValue),
//                 spread: odds.spread,
//             },
//             create: {
//                 gameId: existingGame.id,
//                 homeTeamId: existingGame.homeTeamId,
//                 awayTeamId: existingGame.awayTeamId,
//                 homeMoneyline: odds.homeTeamOdds.close.pointSpread.american,
//                 awayMoneyline: odds.awayTeamOdds.close.pointSpread.american,
//                 overUnder: parseFloat(odds.current.total.alternateDisplayValue),
//                 spread: odds.spread,
//             },
//         });
//     }
// }

// fetchAndStoreOdds();
