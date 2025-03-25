// import { PrismaClient, GameStatus, GameType } from "@prisma/client";
// import axios from "axios";

// const prisma = new PrismaClient();
// const SEASON_ID = 1;
// const LEAGUE_ID = 2; // Replace with your MLB league ID

// async function seedGames() {
//     try {
//         // Fetch MLB schedule from the API
//         const { data } = await axios.get(
//             "https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2025-03-18&endDate=2025-09-28&season=2025&gameType=R",
//         );

//         const dates = data.dates;
//         for (const dateEntry of dates) {
//             for (const game of dateEntry.games) {
//                 const { gamePk, gameDate, status, gameType, teams, venue } = game;

//                 // Get mlb_api_ids
//                 const homeTeamApiId = teams.home.team.id;
//                 const awayTeamApiId = teams.away.team.id;
//                 const venueApiId = venue?.id;

//                 // Lookup corresponding DB IDs
//                 const homeTeam = await prisma.team.findUnique({
//                     where: { mlb_api_id: homeTeamApiId },
//                 });

//                 const awayTeam = await prisma.team.findUnique({
//                     where: { mlb_api_id: awayTeamApiId },
//                 });

//                 const venueRecord = await prisma.venue.findUnique({
//                     where: { mlb_api_id: venueApiId },
//                 });

//                 if (!homeTeam || !awayTeam || !venueRecord) {
//                     console.warn(`Skipping game ${gamePk} due to missing team or venue.`);
//                     continue;
//                 }

//                 // Insert game into the database
//                 await prisma.game.create({
//                     data: {
//                         mlb_api_id: gamePk,
//                         league_id: LEAGUE_ID,
//                         season_id: SEASON_ID,
//                         home_team_id: homeTeam.id,
//                         away_team_id: awayTeam.id,
//                         venue_id: venueRecord.id,
//                         game_type: gameType as GameType,
//                         game_date: new Date(gameDate),
//                         game_status: status.statusCode == "F" ? GameStatus.FINAL : GameStatus.SCHEDULED,
//                         is_neutral_site: false, // Set based on special cases if needed
//                     },
//                 });

//                 console.log(`Seeded game ${gamePk}`);
//             }
//         }

//         console.log("✅ Finished seeding MLB regular season schedule.");
//     } catch (error) {
//         console.error("❌ Error seeding games:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// seedGames();
