// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// // todo: fix individual player pitching score calculation on the season
// // game id is 501
// // white sox id 13
// // twins id 10

// async function recalculateTeamStats() {
//     try {
//         const teams = await prisma.team.findMany({
//             where: {
//                 id: { in: [0] },
//             },
//         });

//         for (const team of teams) {
//             // update team season pitching stats
//             const pitchingStats = await prisma.teamGamePitchingStats.findMany({
//                 where: {
//                     teamId: team.id,
//                 },
//             });

//             await prisma.teamSeasonPitchingStats.update({
//                 where: {
//                     teamId_seasonId: {
//                         teamId: team.id,
//                         seasonId: 1,
//                     },
//                 },
//                 data: {
//                     gamesPlayed: pitchingStats.length,
//                     flyouts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.flyouts ?? 0);
//                     }, 0),
//                     groundOuts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.groundOuts ?? 0);
//                     }, 0),
//                     airOuts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.airOuts ?? 0);
//                     }, 0),
//                     runs: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.runs ?? 0);
//                     }, 0),
//                     doubles: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.doubles ?? 0);
//                     }, 0),
//                     triples: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.triples ?? 0);
//                     }, 0),
//                     homeRuns: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.homeRuns ?? 0);
//                     }, 0),
//                     strikeOuts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.strikeOuts ?? 0);
//                     }, 0),
//                     baseOnBalls: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.baseOnBalls ?? 0);
//                     }, 0),
//                     intentionalWalks: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.intentionalWalks ?? 0);
//                     }, 0),
//                     hits: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.hits ?? 0);
//                     }, 0),
//                     hitByPitch: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.hitByPitch ?? 0);
//                     }, 0),
//                     atBats: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.atBats ?? 0);
//                     }, 0),
//                     caughtStealing: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.caughtStealing ?? 0);
//                     }, 0),
//                     stolenBases: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.stolenBases ?? 0);
//                     }, 0),
//                     numberOfPitches: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.numberOfPitches ?? 0);
//                     }, 0),
//                     inningsPitched: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.inningsPitched ?? 0);
//                     }, 0),
//                     saveOpporunities: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.saveOpporunities ?? 0);
//                     }, 0),
//                     earnedRuns: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.earnedRuns ?? 0);
//                     }, 0),
//                     battersFaced: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.battersFaced ?? 0);
//                     }, 0),
//                     outs: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.outs ?? 0);
//                     }, 0),
//                     completeGames: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.completeGames ?? 0);
//                     }, 0),
//                     shutouts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.shutouts ?? 0);
//                     }, 0),
//                     pitchesThrown: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.pitchesThrown ?? 0);
//                     }, 0),
//                     balls: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.balls ?? 0);
//                     }, 0),
//                     strikes: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.strikes ?? 0);
//                     }, 0),
//                     hitBatsmen: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.hitBatsmen ?? 0);
//                     }, 0),
//                     balks: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.balks ?? 0);
//                     }, 0),
//                     wildPitches: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.wildPitches ?? 0);
//                     }, 0),
//                     pickoffs: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.pickoffs ?? 0);
//                     }, 0),
//                     rbi: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.rbi ?? 0);
//                     }, 0),
//                     inheritedRunners: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.inheritedRunners ?? 0);
//                     }, 0),
//                     inheritedRunnersScored: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.inheritedRunnersScored ?? 0);
//                     }, 0),
//                     catchersInterference: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.catchersInterference ?? 0);
//                     }, 0),
//                     sacBunts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.sacBunts ?? 0);
//                     }, 0),
//                     sacFlies: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.sacFlies ?? 0);
//                     }, 0),
//                     passedBall: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.passedBall ?? 0);
//                     }, 0),
//                     popOuts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.popOuts ?? 0);
//                     }, 0),
//                     lineOuts: pitchingStats.reduce((acc, stats) => {
//                         return acc + (stats.lineOuts ?? 0);
//                     }, 0),
//                 },
//             });

//             // update team season batting stats
//             const battingStats = await prisma.teamGameBattingStats.findMany({
//                 where: {
//                     teamId: team.id,
//                 },
//             });

//             await prisma.teamSeasonBattingStats.update({
//                 where: {
//                     teamId_seasonId: {
//                         teamId: team.id,
//                         seasonId: 1,
//                     },
//                 },
//                 data: {
//                     gamesPlayed: battingStats.length,
//                     flyOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.flyOuts ?? 0);
//                     }, 0),
//                     groundOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.groundOuts ?? 0);
//                     }, 0),
//                     airOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.airOuts ?? 0);
//                     }, 0),
//                     runs: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.runs ?? 0);
//                     }, 0),
//                     doubles: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.doubles ?? 0);
//                     }, 0),
//                     triples: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.triples ?? 0);
//                     }, 0),
//                     homeRuns: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.homeRuns ?? 0);
//                     }, 0),
//                     strikeOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.strikeOuts ?? 0);
//                     }, 0),
//                     baseOnBalls: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.baseOnBalls ?? 0);
//                     }, 0),
//                     intentionalWalks: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.intentionalWalks ?? 0);
//                     }, 0),
//                     hits: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.hits ?? 0);
//                     }, 0),
//                     hitByPitch: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.hitByPitch ?? 0);
//                     }, 0),
//                     atBats: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.atBats ?? 0);
//                     }, 0),
//                     caughtStealing: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.caughtStealing ?? 0);
//                     }, 0),
//                     stolenBases: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.stolenBases ?? 0);
//                     }, 0),
//                     groundIntoDoublePlay: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.groundIntoDoublePlay ?? 0);
//                     }, 0),
//                     groundIntoTriplePlay: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.groundIntoTriplePlay ?? 0);
//                     }, 0),
//                     plateAppearances: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.plateAppearances ?? 0);
//                     }, 0),
//                     totalBases: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.totalBases ?? 0);
//                     }, 0),
//                     rbi: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.rbi ?? 0);
//                     }, 0),
//                     leftOnBase: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.leftOnBase ?? 0);
//                     }, 0),
//                     sacBunts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.sacBunts ?? 0);
//                     }, 0),
//                     sacFlies: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.sacFlies ?? 0);
//                     }, 0),
//                     catchersInterference: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.catchersInterference ?? 0);
//                     }, 0),
//                     pickoffs: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.pickoffs ?? 0);
//                     }, 0),
//                     popOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.popOuts ?? 0);
//                     }, 0),
//                     lineOuts: battingStats.reduce((acc, stats) => {
//                         return acc + (stats.lineOuts ?? 0);
//                     }, 0),
//                 },
//             });

//             // update team season fielding stats
//             const fieldingStats = await prisma.teamGameFieldingStats.findMany({
//                 where: {
//                     teamId: team.id,
//                 },
//             });

//             await prisma.teamSeasonFieldingStats.update({
//                 where: {
//                     teamId_seasonId: {
//                         teamId: team.id,
//                         seasonId: 1,
//                     },
//                 },
//                 data: {
//                     gamesPlayed: fieldingStats.length,
//                     caughtStealing: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.caughtStealing ?? 0);
//                     }, 0),
//                     stolenBases: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.stolenBases ?? 0);
//                     }, 0),
//                     assists: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.assists ?? 0);
//                     }, 0),
//                     putOuts: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.putOuts ?? 0);
//                     }, 0),
//                     errors: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.errors ?? 0);
//                     }, 0),
//                     chances: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.chances ?? 0);
//                     }, 0),
//                     passedBall: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.passedBall ?? 0);
//                     }, 0),
//                     pickOffs: fieldingStats.reduce((acc, stats) => {
//                         return acc + (stats.pickOffs ?? 0);
//                     }, 0),
//                 },
//             });

//             console.log("updated team: ", team.name);
//         }
//     } catch (error) {
//         console.error("Error updating team pitching scores:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// recalculateTeamStats();
