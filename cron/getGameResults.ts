import { GameStatus, PrismaClient } from "@prisma/client";
import axios from "axios";
import { updateElo } from "./updateElo";

// status code
// I - In Progress
// F - Final
// S or P - Scheduled

const prisma = new PrismaClient();

async function getGameResults() {
    try {
        //const today = new Date().toLocaleDateString();
        const { data } = await axios.get(
            `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,lineups&startDate=2025-03-31&endDate=2025-03-31&gameType=R`,
        );

        const { dates } = data;
        if (!dates || dates.length === 0) return;

        const games = dates[0].games;
        if (!games || games.length === 0) return;

        for (const game of games) {
            // Check if game exists
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });

            if (!existingGame) continue;

            const { data } = await axios.get(`https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`);
            const { liveData } = data;

            // Check if the game has already been finalized
            if (existingGame.status === GameStatus.FINAL) {
                console.log(`Game ${game.gamePk} is already finalized. Skipping update.`);
                continue; // Skip already finalized games
            }

            // Ensure we have the final scores from the API
            if (!game.teams || !game.teams.away || !game.teams.home) {
                console.log(`Game ${game.gamePk} does not have valid team data. Skipping update.`);
                continue; // Skip if teams data is missing
            }

            // Ensure game status is FINAL before updating scores
            if (game.status.statusCode !== "F") {
                console.log(
                    `Game ${game.gamePk} is not in FINAL status. Current status: ${game.status.statusCode}. Skipping update.`,
                );
            }

            const awayScore = game.teams.away.score ?? 0; // Default to 0 if score is missing
            const homeScore = game.teams.home.score ?? 0; // Default to 0 if score is missing
            const winningTeamId = awayScore > homeScore ? existingGame.awayTeamId : existingGame.homeTeamId;
            console.log("winning team", winningTeamId);

            // loop through innings
            const innings = liveData.linescore.innings;
            if (innings) {
                for (const inning of innings) {
                    // create a record of the inning with away and home runs for the specific game
                    const inningNumber = inning.num;
                    console.log(`Inning ${inningNumber}: Away: ${inning.away.runs}, Home: ${inning.home.runs ?? null}`);
                    console.log(inning);

                    // await prisma.inningDetails.create({
                    //     data: {
                    //         gameId: existingGame.id,
                    //         inning: inningNumber,
                    //         awayRuns: inning.away.runs ?? 0,
                    //         homeRuns: inning.home.runs ?? 0,
                    //         awayHits: inning.away.hits ?? 0,
                    //         homeHits: inning.home.hits ?? 0,
                    //         awayErrors: inning.away.errors ?? 0,
                    //         homeErrors: inning.home.errors ?? 0,
                    //         awayLeftOn: inning.away.leftOnBase ?? 0,
                    //         homeLeftOn: inning.home.leftOnBase ?? 0,
                    //     },
                    // });
                }
            }

            // update team records
            // Fetch current team records for this game
            const teamRecords = await prisma.teamRecord.findMany({
                where: { gameId: existingGame.id },
            });

            if (teamRecords.length !== 2) {
                console.error(`Expected 2 team records for game ${game.gamePk}, but found ${teamRecords.length}`);
                continue;
            }

            for (const record of teamRecords) {
                //const isHomeTeam = record.teamId === existingGame.homeTeamId;
                //const isWinner = record.teamId === winningTeamId;

                // Update the current game record
                // const updatedRecord = await prisma.teamRecord.update({
                //     where: { id: record.id },
                //     data: {
                //         wins: isWinner ? record.wins + 1 : record.wins,
                //         losses: !isWinner ? record.losses + 1 : record.losses,
                //         homeWins: isHomeTeam && isWinner ? record.homeWins + 1 : record.homeWins,
                //         homeLosses: isHomeTeam && !isWinner ? record.homeLosses + 1 : record.homeLosses,
                //         awayWins: !isHomeTeam && isWinner ? record.awayWins + 1 : record.awayWins,
                //         awayLosses: !isHomeTeam && !isWinner ? record.awayLosses + 1 : record.awayLosses,
                //     },
                // });

                // **Find the next scheduled game for this team**
                const nextGameRecord = await prisma.teamRecord.findFirst({
                    where: {
                        teamId: record.teamId,
                        gameId: { gt: existingGame.id }, // Next game after current game
                    },
                    orderBy: { gameId: "asc" },
                });

                if (nextGameRecord) {
                    // Carry forward updated stats to next game
                    // await prisma.teamRecord.update({
                    //     where: { id: nextGameRecord.id },
                    //     data: {
                    //         wins: updatedRecord.wins,
                    //         losses: updatedRecord.losses,
                    //         homeWins: updatedRecord.homeWins,
                    //         homeLosses: updatedRecord.homeLosses,
                    //         awayWins: updatedRecord.awayWins,
                    //         awayLosses: updatedRecord.awayLosses,
                    //     },
                    // });

                    console.log(
                        `Carried forward record to next game ${nextGameRecord.gameId} for team ${record.teamId}`,
                    );
                }
            }

            // update team records
            // Fetch current team records for this game
            const teamELOs = await prisma.teamELO.findMany({
                where: { gameId: existingGame.id },
            });

            const homeElo = teamELOs.find((elo) => elo.teamId === existingGame.homeTeamId);
            const awayElo = teamELOs.find((elo) => elo.teamId === existingGame.awayTeamId);

            if (!homeElo || !awayElo) {
                console.error(`Expected 2 team ELO records for game ${game.gamePk}, but found ${teamRecords.length}`);
                continue;
            }

            // 1, 32, 33 are all neutral venue ids
            const neutralVenueIds = [0, 1, 32, 33];
            const isNeutralVenue = neutralVenueIds.includes(existingGame.venue_id ?? 0);
            const eloData = updateElo({
                homeElo: homeElo.elo.toNumber(),
                awayElo: awayElo.elo.toNumber(),
                homeScore,
                awayScore,
                isPlayoff: false,
                isNeutral: isNeutralVenue,
            });

            console.log("eloData", eloData);

            for (const elo of teamELOs) {
                // **Find the next scheduled game for this team**
                const nextGameELO = await prisma.teamELO.findFirst({
                    where: {
                        teamId: elo.teamId,
                        gameId: { gt: existingGame.id }, // Next game after current game
                    },
                    orderBy: { gameId: "asc" },
                });

                if (nextGameELO) {
                    // Carry forward updated stats to next game
                    // await prisma.teamRecord.update({
                    //     where: { id: nextGameRecord.id },
                    //     data: {
                    //         wins: updatedRecord.wins,
                    //         losses: updatedRecord.losses,
                    //         homeWins: updatedRecord.homeWins,
                    //         homeLosses: updatedRecord.homeLosses,
                    //         awayWins: updatedRecord.awayWins,
                    //         awayLosses: updatedRecord.awayLosses,
                    //     },
                    // });

                    console.log(
                        `Carried forward ELO to next game ${nextGameELO.gameId} for team ${nextGameELO.teamId}`,
                    );
                }
            }

            console.log(`Game ${game.gamePk} - Away: ${awayScore}, Home: ${homeScore}`);

            // Update game
            // await prisma.game.update({
            //     where: { mlb_api_id: game.gamePk },
            //     data: {
            //         awayScore: 0,
            //         homeScore: 0,
            //         status: GameStatus.FINAL,
            //         winningTeamId: winningTeamId,
            //     },
            // });

            console.log(`Updated game ${game.gamePk}`);
        }
    } catch (error) {
        console.error("Error updating game results:", error);
    } finally {
        await prisma.$disconnect();
    }
}

getGameResults();
