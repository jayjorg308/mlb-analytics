// import { GameStatus, PrismaClient } from "@prisma/client";
// import axios from "axios";

// const prisma = new PrismaClient();

// const SEASON_ID = 1;

// const mapStatus = (statusCode: string): GameStatus => {
//     switch (statusCode) {
//         case "S":
//             return GameStatus.SCHEDULED;
//         case "F":
//             return GameStatus.FINAL;
//         default:
//             return GameStatus.SCHEDULED;
//     }
// };

// async function logGame(gameId: number) {
//     try {
//         // Fetch MLB schedule from the API
//         const { data } = await axios.get(`https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`);
//         const { gameData, liveData } = data;

//         const boxscore = liveData.boxscore;

//         // Get mlb_api_ids
//         const homeTeamApiId = gameData.teams.home.id;
//         const awayTeamApiId = gameData.teams.away.id;

//         // Lookup corresponding DB IDs
//         const homeTeam = await prisma.team.findUnique({
//             where: { mlb_api_id: homeTeamApiId },
//         });

//         const awayTeam = await prisma.team.findUnique({
//             where: { mlb_api_id: awayTeamApiId },
//         });

//         const homeScore = boxscore.teams.home.teamStats.batting.runs;
//         const awayScore = boxscore.teams.away.teamStats.batting.runs;

//         // Update game in the database
//         await prisma.game.update({
//             where: { mlb_api_id: gameId },
//             data: {
//                 status: mapStatus(gameData.status.statusCode),
//                 homeScore: homeScore,
//                 awayScore: awayScore,
//                 winningTeamId: homeScore > awayScore ? homeTeam?.id : awayTeam?.id,
//             },
//         });

//         // Process players and stats
//         for (const teamType of ["home", "away"]) {
//             const teamData = boxscore.teams[teamType];
//             const teamId = teamData.team.id;
//             const battingOrder = teamData.battingOrder;

//             for (const playerKey in teamData.players) {
//                 const playerData = teamData.players[playerKey].person;
//                 const stats = teamData.players[playerKey].stats;

//                 // Ensure the player exists
//                 const player = await prisma.player.upsert({
//                     where: { mlb_api_id: playerData.id },
//                     update: {},
//                     create: {
//                         mlb_api_id: playerData.id,
//                         firstName: firstName,
//                         lastName: lastName,
//                         position: position.abbreviation,
//                         uniformNumber: parseInt(playerData.jerseyNumber as string),
//                         teamId: team.id,
//                         photoUrl: `https://media.gamblersanonymo.us/mlb/players/${playerData.id}.jpg`,
//                     },
//                 });

//                 // Insert player game stats
//                 await prisma.playerGameStats.create({
//                     data: {
//                         playerId: player.id,
//                         gameId: game.id,
//                         atBats: stats.batting?.atBats || 0,
//                         hits: stats.batting?.hits || 0,
//                         homeRuns: stats.batting?.homeRuns || 0,
//                         RBIs: stats.batting?.rbi || 0,
//                         inningsPitched: stats.pitching?.inningsPitched || 0,
//                         strikeouts: stats.pitching?.strikeOuts || 0,
//                         earnedRuns: stats.pitching?.earnedRuns || 0,
//                     },
//                 });

//                 // Update player season stats
//                 await prisma.playerSeasonStats.upsert({
//                     where: { playerId_seasonId: { playerId: player.id, seasonId: SEASON_ID } },
//                     update: {
//                         gamesPlayed: { increment: 1 },
//                         atBats: { increment: stats.batting?.atBats || 0 },
//                         hits: { increment: stats.batting?.hits || 0 },
//                         homeRuns: { increment: stats.batting?.homeRuns || 0 },
//                         RBIs: { increment: stats.batting?.rbi || 0 },
//                     },
//                     create: {
//                         playerId: player.id,
//                         seasonId: SEASON_ID,
//                         gamesPlayed: 1,
//                         atBats: stats.batting?.atBats || 0,
//                         hits: stats.batting?.hits || 0,
//                         homeRuns: stats.batting?.homeRuns || 0,
//                         RBIs: stats.batting?.rbi || 0,
//                     },
//                 });
//             }
//         }

//         console.log("✅ Finished logging game.");
//     } catch (error) {
//         console.error("❌ Error logging game:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// // 778563

// // 778564

// const gameId = 778564;
// logGame(gameId);
