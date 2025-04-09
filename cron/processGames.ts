import { Game, GameStatus, PitcherDecision, Prisma, PrismaClient } from "@prisma/client";
import axios from "axios";
import { updateElo } from "./updateElo";
import {
    GameDetails,
    ScheduleData,
    GameData,
    Inning,
    Boxscore,
    GameBattingStatsTeam,
    GamePitchingStatsTeam,
    GameFieldingStatsTeam,
    GameBatting,
    GamePitching,
} from "./interfaces";

const prisma = new PrismaClient();

async function getGamesForDay(): Promise<GameDetails[]> {
    //const today = new Date().toLocaleDateString();
    const { data }: { data: ScheduleData } = await axios.get(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2025-04-09&endDate=2025-04-09&gameType=R`,
    );

    return data.dates.flatMap((date) => date.games);
}

async function getGameResults() {
    try {
        const games = await getGamesForDay();

        for (const game of games) {
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });
            if (!existingGame) continue;

            if (existingGame.status === GameStatus.FINAL) continue;
            if (game.status.statusCode !== "F") continue;

            try {
                // Fetch game data outside of transaction
                const { data }: { data: GameData } = await axios.get(
                    `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`,
                );
                const { liveData } = data;

                const homeTeamRuns = liveData.linescore.teams.home.runs;
                const awayTeamRuns = liveData.linescore.teams.away.runs;
                const homeTeamWon = homeTeamRuns > awayTeamRuns;
                const winningTeamId = homeTeamWon ? existingGame.homeTeamId : existingGame.awayTeamId;

                // Process each operation in its own transaction
                // This prevents the entire process from failing if one part fails

                // 1. Update final score and status
                await prisma
                    .$transaction(async (tx) => {
                        await updateFinalScoreAndStatus(awayTeamRuns, homeTeamRuns, winningTeamId, game, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating final score for game ${game.gamePk}:`, error);
                    });

                // 2. Create inning details
                await prisma
                    .$transaction(async (tx) => {
                        await insertInningDetails(liveData.linescore.innings, existingGame.id, game.gamePk, tx);
                    })
                    .catch((error) => {
                        console.error(`Error inserting inning details for game ${game.gamePk}:`, error);
                    });

                // 3. Update team records
                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamRecords(winningTeamId, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team records for game ${game.gamePk}:`, error);
                    });

                // 4. Update team ELO
                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamElo(awayTeamRuns, homeTeamRuns, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team ELO for game ${game.gamePk}:`, error);
                    });

                // 5. Update player stats
                await updatePlayerStats(liveData.boxscore, game, existingGame).catch((error) => {
                    console.error(`Error updating player stats for game ${game.gamePk}:`, error);
                });

                // 6. Update team game stats
                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamGameStats(liveData.boxscore, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team game stats for game ${game.gamePk}:`, error);
                    });

                // 7. Update team season stats
                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamSeasonStats(liveData.boxscore, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team season stats for game ${game.gamePk}:`, error);
                    });

                console.log(`Successfully processed game ${game.gamePk}`);
            } catch (error) {
                console.error(`Error processing game ${game.gamePk}:`, error);
                // Continue with the next game even if this one fails
            }
        }
    } catch (error) {
        console.error("Error updating game results:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function updateFinalScoreAndStatus(
    awayTeamRuns: number,
    homeTeamRuns: number,
    winningTeamId: number,
    game: GameDetails,
    tx: Prisma.TransactionClient,
) {
    try {
        await tx.game.update({
            where: { mlb_api_id: game.gamePk },
            data: {
                status: game.status.statusCode === "F" ? GameStatus.FINAL : GameStatus.SCHEDULED,
                homeScore: homeTeamRuns,
                awayScore: awayTeamRuns,
                winningTeamId: winningTeamId,
            },
        });

        console.log(`Updated game ${game.gamePk} scores and result.`);
    } catch (error) {
        console.error(`Error updating final score and status for game ${game.gamePk}:`, error);
    }
}

async function insertInningDetails(innings: Inning[], dbGameId: number, gamePk: number, tx: Prisma.TransactionClient) {
    try {
        if (!innings || innings.length === 0) {
            console.warn(`No innings found for game ${gamePk}`);
            return;
        }

        for (const inning of innings) {
            await tx.inningDetails.create({
                data: {
                    gameId: dbGameId,
                    inning: inning.num,
                    awayRuns: inning.away?.runs,
                    homeRuns: inning.home?.runs,
                    awayHits: inning.away?.hits,
                    homeHits: inning.home?.hits,
                    awayErrors: inning.away?.errors,
                    homeErrors: inning.home?.errors,
                    awayLeftOn: inning.away?.leftOnBase,
                    homeLeftOn: inning.home?.leftOnBase,
                },
            });
        }

        console.log(`Inserted ${innings.length} inning records for game ${gamePk}`);
    } catch (error) {
        console.error(`Error inserting inning details for game ${gamePk}:`, error);
    }
}

async function updateTeamRecords(
    winningTeamId: number,
    game: GameDetails,
    existingGame: Game,
    tx: Prisma.TransactionClient,
) {
    try {
        // Fetch current team records for this game
        const teamRecords = await tx.teamRecord.findMany({
            where: { gameId: existingGame.id },
        });

        if (teamRecords.length !== 2) {
            console.error(`Expected 2 team records for game ${game.gamePk}, but found ${teamRecords.length}`);
            return;
        }

        for (const record of teamRecords) {
            const isHomeTeam = record.teamId === existingGame.homeTeamId;
            const isWinner = record.teamId === winningTeamId;

            // Update the current game record
            const updatedRecord = await tx.teamRecord.update({
                where: { id: record.id },
                data: {
                    wins: isWinner ? record.wins + 1 : record.wins,
                    losses: !isWinner ? record.losses + 1 : record.losses,
                    homeWins: isHomeTeam && isWinner ? record.homeWins + 1 : record.homeWins,
                    homeLosses: isHomeTeam && !isWinner ? record.homeLosses + 1 : record.homeLosses,
                    awayWins: !isHomeTeam && isWinner ? record.awayWins + 1 : record.awayWins,
                    awayLosses: !isHomeTeam && !isWinner ? record.awayLosses + 1 : record.awayLosses,
                },
            });

            // **Find the next scheduled game for this team**
            const nextGameRecord = await tx.teamRecord.findFirst({
                where: {
                    teamId: record.teamId,
                    gameId: { gt: existingGame.id }, // Next game after current game
                },
                orderBy: { gameId: "asc" },
            });

            if (nextGameRecord) {
                // Carry forward updated stats to next game
                await tx.teamRecord.update({
                    where: { id: nextGameRecord.id },
                    data: {
                        wins: updatedRecord.wins,
                        losses: updatedRecord.losses,
                        homeWins: updatedRecord.homeWins,
                        homeLosses: updatedRecord.homeLosses,
                        awayWins: updatedRecord.awayWins,
                        awayLosses: updatedRecord.awayLosses,
                    },
                });

                console.log(`Carried forward record to next game ${nextGameRecord.gameId} for team ${record.teamId}`);
            }
        }
    } catch (error) {
        console.error(`Error updating team records for game ${game.gamePk}:`, error);
    }
}

async function updateTeamElo(
    awayTeamRuns: number,
    homeTeamRuns: number,
    game: GameDetails,
    existingGame: Game,
    tx: Prisma.TransactionClient,
) {
    try {
        // Fetch current team ELO records for this game
        const teamELOs = await tx.teamELO.findMany({
            where: { gameId: existingGame.id },
        });

        const homeElo = teamELOs.find((elo) => elo.teamId === existingGame.homeTeamId);
        const awayElo = teamELOs.find((elo) => elo.teamId === existingGame.awayTeamId);

        if (!homeElo || !awayElo) {
            console.error(`Expected 2 team ELO records for game ${game.gamePk}, but found ${teamELOs.length}`);
            return;
        }

        const eloData = updateElo({
            homeElo: homeElo.elo.toNumber(),
            awayElo: awayElo.elo.toNumber(),
            homeScore: homeTeamRuns,
            awayScore: awayTeamRuns,
            isPlayoff: existingGame.isPostseason,
            isNeutral: existingGame.isNeutralSite,
        });

        for (const elo of teamELOs) {
            const isHomeTeam = elo.teamId === existingGame.homeTeamId;

            // Update the current game record
            const updatedEloRecord = await tx.teamELO.update({
                where: { id: elo.id },
                data: {
                    elo: isHomeTeam ? eloData.newHomeElo : eloData.newAwayElo,
                    eloChange: isHomeTeam ? eloData.eloChange : -eloData.eloChange,
                },
            });

            // **Find the next scheduled game for this team**
            const nextGameELO = await tx.teamELO.findFirst({
                where: {
                    teamId: elo.teamId,
                    gameId: { gt: existingGame.id }, // Next game after current game
                },
                orderBy: { gameId: "asc" },
            });

            if (nextGameELO) {
                // Carry forward updated stats to next game
                await tx.teamELO.update({
                    where: { id: nextGameELO.id },
                    data: {
                        elo: updatedEloRecord.elo,
                    },
                });

                console.log(`Carried forward ELO to next game ${nextGameELO.gameId} for team ${nextGameELO.teamId}`);
            }
        }
    } catch (error) {
        console.error(`Error updating Elo for game ${game.gamePk}:`, error);
    }
}

async function updateTeamGameStats(
    boxscore: Boxscore,
    game: GameDetails,
    existingGame: Game,
    tx: Prisma.TransactionClient,
) {
    try {
        if (!boxscore) return;

        // check to see if records already exist for this game
        const existingBattingStats = await tx.teamGameBattingStats.findMany({
            where: { gameId: existingGame.id },
        });
        const existingPitchingStats = await tx.teamGamePitchingStats.findMany({
            where: { gameId: existingGame.id },
        });
        const existingFieldingStats = await tx.teamGameFieldingStats.findMany({
            where: { gameId: existingGame.id },
        });

        if (existingBattingStats.length > 0 || existingPitchingStats.length > 0 || existingFieldingStats.length > 0) {
            console.log(`Game ${game.gamePk} stats already exist. Skipping update.`);
            return;
        }

        for (const [side, teamData] of Object.entries(boxscore.teams)) {
            const isHome = side === "home";
            const teamId = isHome ? existingGame.homeTeamId : existingGame.awayTeamId;

            const battingstats =
                teamData.teamStats?.batting === undefined
                    ? null
                    : (teamData.teamStats?.batting as GameBattingStatsTeam);
            const pitchingStats =
                teamData.teamStats?.pitching === undefined
                    ? null
                    : (teamData.teamStats?.pitching as GamePitchingStatsTeam);
            const fieldingStats =
                teamData.teamStats?.fielding === undefined
                    ? null
                    : (teamData.teamStats?.fielding as GameFieldingStatsTeam);

            // batting stats
            if (battingstats) {
                await tx.teamGameBattingStats.create({
                    data: {
                        teamId: teamId,
                        gameId: existingGame.id,
                        flyOuts: battingstats.flyOuts,
                        groundOuts: battingstats.groundOuts,
                        airOuts: battingstats.airOuts,
                        runs: battingstats.runs,
                        doubles: battingstats.doubles,
                        triples: battingstats.triples,
                        homeRuns: battingstats.homeRuns,
                        strikeOuts: battingstats.strikeOuts,
                        baseOnBalls: battingstats.baseOnBalls,
                        intentionalWalks: battingstats.intentionalWalks,
                        hits: battingstats.hits,
                        hitByPitch: battingstats.hitByPitch,
                        atBats: battingstats.atBats,
                        caughtStealing: battingstats.caughtStealing,
                        stolenBases: battingstats.stolenBases,
                        groundIntoDoublePlay: battingstats.groundIntoDoublePlay,
                        groundIntoTriplePlay: battingstats.groundIntoTriplePlay,
                        plateAppearances: battingstats.plateAppearances,
                        totalBases: battingstats.totalBases,
                        rbi: battingstats.rbi,
                        leftOnBase: battingstats.leftOnBase,
                        sacBunts: battingstats.sacBunts,
                        sacFlies: battingstats.sacFlies,
                        catchersInterference: battingstats.catchersInterference,
                        pickoffs: battingstats.pickoffs,
                        popOuts: battingstats.popOuts,
                        lineOuts: battingstats.lineOuts,
                    },
                });
            }

            // pitching stats
            if (pitchingStats) {
                await tx.teamGamePitchingStats.create({
                    data: {
                        teamId: teamId,
                        gameId: existingGame.id,
                        flyouts: pitchingStats.flyOuts,
                        groundOuts: pitchingStats.groundOuts,
                        airOuts: pitchingStats.airOuts,
                        runs: pitchingStats.runs,
                        doubles: pitchingStats.doubles,
                        triples: pitchingStats.triples,
                        homeRuns: pitchingStats.homeRuns,
                        strikeOuts: pitchingStats.strikeOuts,
                        baseOnBalls: pitchingStats.baseOnBalls,
                        intentionalWalks: pitchingStats.intentionalWalks,
                        hits: pitchingStats.hits,
                        hitByPitch: pitchingStats.hitByPitch,
                        atBats: pitchingStats.atBats,
                        caughtStealing: pitchingStats.caughtStealing,
                        stolenBases: pitchingStats.stolenBases,
                        numberOfPitches: pitchingStats.numberOfPitches,
                        inningsPitched: parseInt(pitchingStats.inningsPitched),
                        saveOpporunities: pitchingStats.saveOpportunities,
                        earnedRuns: pitchingStats.earnedRuns,
                        battersFaced: pitchingStats.battersFaced,
                        outs: pitchingStats.outs,
                        completeGames: pitchingStats.completeGames,
                        shutouts: pitchingStats.shutouts,
                        pitchesThrown: pitchingStats.pitchesThrown,
                        balls: pitchingStats.balls,
                        strikes: pitchingStats.strikes,
                        hitBatsmen: pitchingStats.hitBatsmen,
                        balks: pitchingStats.balks,
                        wildPitches: pitchingStats.wildPitches,
                        pickoffs: pitchingStats.pickoffs,
                        rbi: pitchingStats.rbi,
                        inheritedRunners: pitchingStats.inheritedRunners,
                        inheritedRunnersScored: pitchingStats.inheritedRunnersScored,
                        catchersInterference: pitchingStats.catchersInterference,
                        sacBunts: pitchingStats.sacBunts,
                        sacFlies: pitchingStats.sacFlies,
                        passedBall: pitchingStats.passedBall,
                        popOuts: pitchingStats.popOuts,
                        lineOuts: pitchingStats.lineOuts,
                    },
                });
            }

            // fielding stats
            if (fieldingStats) {
                await tx.teamGameFieldingStats.create({
                    data: {
                        teamId: teamId,
                        gameId: existingGame.id,
                        caughtStealing: fieldingStats.caughtStealing,
                        stolenBases: fieldingStats.stolenBases,
                        assists: fieldingStats.assists,
                        putOuts: fieldingStats.putOuts,
                        errors: fieldingStats.errors,
                        chances: fieldingStats.chances,
                        passedBall: fieldingStats.passedBall,
                        pickOffs: fieldingStats.pickoffs,
                    },
                });
            }

            console.log(`Inserted game stats for ${teamData.team.name} in game ${game.gamePk}`);
        }
    } catch (error) {
        console.error(`Error updating team game stats for game ${game.gamePk}:`, error);
    }
}

async function updateTeamSeasonStats(
    boxscore: Boxscore,
    game: GameDetails,
    existingGame: Game,
    tx: Prisma.TransactionClient,
) {
    try {
        // Process each team's stats
        for (const [side, teamData] of Object.entries(boxscore.teams)) {
            const isHome = side === "home";
            const teamId = isHome ? existingGame.homeTeamId : existingGame.awayTeamId;

            const battingstats =
                teamData.teamStats?.batting === undefined
                    ? null
                    : (teamData.teamStats?.batting as GameBattingStatsTeam);
            const pitchingStats =
                teamData.teamStats?.pitching === undefined
                    ? null
                    : (teamData.teamStats?.pitching as GamePitchingStatsTeam);
            const fieldingStats =
                teamData.teamStats?.fielding === undefined
                    ? null
                    : (teamData.teamStats?.fielding as GameFieldingStatsTeam);

            // Update batting season stats
            if (battingstats) await updateTeamSeasonBattingStats(teamId, existingGame.season_id, battingstats, tx);

            // Update pitching season stats
            if (pitchingStats) await updateTeamSeasonPitchingStats(teamId, existingGame.season_id, pitchingStats, tx);

            // Update fielding season stats
            if (fieldingStats) await updateTeamSeasonFieldingStats(teamId, existingGame.season_id, fieldingStats, tx);

            console.log(`Updated season stats for team ${teamId} after game ${game.gamePk}`);
        }
    } catch (error) {
        console.error(`Error updating team season stats for game ${game.gamePk}:`, error);
    }
}

async function updateTeamSeasonBattingStats(
    teamId: number,
    seasonId: number,
    gameStats: GameBattingStatsTeam,
    tx: Prisma.TransactionClient,
) {
    // Get the current season stats or create a new one if it doesn't exist
    const seasonStats = await tx.teamSeasonBattingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
        // Create a new season stats record if it doesn't exist
        await tx.teamSeasonBattingStats.create({
            data: {
                teamId: teamId,
                seasonId: seasonId,
                gamesPlayed: 1,
                flyOuts: gameStats.flyOuts,
                groundOuts: gameStats.groundOuts,
                airOuts: gameStats.airOuts,
                runs: gameStats.runs,
                doubles: gameStats.doubles,
                triples: gameStats.triples,
                homeRuns: gameStats.homeRuns,
                strikeOuts: gameStats.strikeOuts,
                baseOnBalls: gameStats.baseOnBalls,
                intentionalWalks: gameStats.intentionalWalks,
                hits: gameStats.hits,
                hitByPitch: gameStats.hitByPitch,
                atBats: gameStats.atBats,
                caughtStealing: gameStats.caughtStealing,
                stolenBases: gameStats.stolenBases,
                groundIntoDoublePlay: gameStats.groundIntoDoublePlay,
                groundIntoTriplePlay: gameStats.groundIntoTriplePlay,
                plateAppearances: gameStats.plateAppearances,
                totalBases: gameStats.totalBases,
                rbi: gameStats.rbi,
                leftOnBase: gameStats.leftOnBase,
                sacBunts: gameStats.sacBunts,
                sacFlies: gameStats.sacFlies,
                catchersInterference: gameStats.catchersInterference,
                pickoffs: gameStats.pickoffs,
                popOuts: gameStats.popOuts,
                lineOuts: gameStats.lineOuts,
            },
        });
    } else {
        // Update the existing season stats by adding the game stats
        await tx.teamSeasonBattingStats.update({
            where: {
                teamId_seasonId: {
                    teamId: teamId,
                    seasonId: seasonId,
                },
            },
            data: {
                gamesPlayed: seasonStats.gamesPlayed + 1,
                flyOuts: seasonStats.flyOuts + gameStats.flyOuts,
                groundOuts: seasonStats.groundOuts + gameStats.groundOuts,
                airOuts: seasonStats.airOuts + gameStats.airOuts,
                runs: seasonStats.runs + gameStats.runs,
                doubles: seasonStats.doubles + gameStats.doubles,
                triples: seasonStats.triples + gameStats.triples,
                homeRuns: seasonStats.homeRuns + gameStats.homeRuns,
                strikeOuts: seasonStats.strikeOuts + gameStats.strikeOuts,
                baseOnBalls: seasonStats.baseOnBalls + gameStats.baseOnBalls,
                intentionalWalks: seasonStats.intentionalWalks + gameStats.intentionalWalks,
                hits: seasonStats.hits + gameStats.hits,
                hitByPitch: seasonStats.hitByPitch + gameStats.hitByPitch,
                atBats: seasonStats.atBats + gameStats.atBats,
                caughtStealing: seasonStats.caughtStealing + gameStats.caughtStealing,
                stolenBases: seasonStats.stolenBases + gameStats.stolenBases,
                groundIntoDoublePlay: seasonStats.groundIntoDoublePlay + gameStats.groundIntoDoublePlay,
                groundIntoTriplePlay: seasonStats.groundIntoTriplePlay + gameStats.groundIntoTriplePlay,
                plateAppearances: seasonStats.plateAppearances + gameStats.plateAppearances,
                totalBases: seasonStats.totalBases + gameStats.totalBases,
                rbi: seasonStats.rbi + gameStats.rbi,
                leftOnBase: seasonStats.leftOnBase + gameStats.leftOnBase,
                sacBunts: seasonStats.sacBunts + gameStats.sacBunts,
                sacFlies: seasonStats.sacFlies + gameStats.sacFlies,
                catchersInterference: seasonStats.catchersInterference + gameStats.catchersInterference,
                pickoffs: seasonStats.pickoffs + gameStats.pickoffs,
                popOuts: seasonStats.popOuts + gameStats.popOuts,
                lineOuts: seasonStats.lineOuts + gameStats.lineOuts,
            },
        });
    }
}

async function updateTeamSeasonPitchingStats(
    teamId: number,
    seasonId: number,
    gameStats: GamePitchingStatsTeam,
    tx: Prisma.TransactionClient,
) {
    // Get the current season stats or create a new one if it doesn't exist
    const seasonStats = await tx.teamSeasonPitchingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
        // Create a new season stats record if it doesn't exist
        await tx.teamSeasonPitchingStats.create({
            data: {
                teamId: teamId,
                seasonId: seasonId,
                gamesPlayed: 1,
                flyouts: gameStats.flyOuts,
                groundOuts: gameStats.groundOuts,
                airOuts: gameStats.airOuts,
                runs: gameStats.runs,
                doubles: gameStats.doubles,
                triples: gameStats.triples,
                homeRuns: gameStats.homeRuns,
                strikeOuts: gameStats.strikeOuts,
                baseOnBalls: gameStats.baseOnBalls,
                intentionalWalks: gameStats.intentionalWalks,
                hits: gameStats.hits,
                hitByPitch: gameStats.hitByPitch,
                atBats: gameStats.atBats,
                caughtStealing: gameStats.caughtStealing,
                stolenBases: gameStats.stolenBases,
                numberOfPitches: gameStats.numberOfPitches,
                inningsPitched: parseFloat(gameStats.inningsPitched),
                saveOpporunities: gameStats.saveOpportunities,
                earnedRuns: gameStats.earnedRuns,
                battersFaced: gameStats.battersFaced,
                outs: gameStats.outs,
                completeGames: gameStats.completeGames,
                shutouts: gameStats.shutouts,
                pitchesThrown: gameStats.pitchesThrown,
                balls: gameStats.balls,
                strikes: gameStats.strikes,
                hitBatsmen: gameStats.hitBatsmen,
                balks: gameStats.balks,
                wildPitches: gameStats.wildPitches,
                pickoffs: gameStats.pickoffs,
                rbi: gameStats.rbi,
                inheritedRunners: gameStats.inheritedRunners,
                inheritedRunnersScored: gameStats.inheritedRunnersScored,
                catchersInterference: gameStats.catchersInterference,
                sacBunts: gameStats.sacBunts,
                sacFlies: gameStats.sacFlies,
                passedBall: gameStats.passedBall,
                popOuts: gameStats.popOuts,
                lineOuts: gameStats.lineOuts,
            },
        });
    } else {
        // Update the existing season stats by adding the game stats
        await tx.teamSeasonPitchingStats.update({
            where: {
                teamId_seasonId: {
                    teamId: teamId,
                    seasonId: seasonId,
                },
            },
            data: {
                gamesPlayed: seasonStats.gamesPlayed + 1,
                flyouts: seasonStats.flyouts + gameStats.flyOuts,
                groundOuts: seasonStats.groundOuts + gameStats.groundOuts,
                airOuts: seasonStats.airOuts + gameStats.airOuts,
                runs: seasonStats.runs + gameStats.runs,
                doubles: seasonStats.doubles + gameStats.doubles,
                triples: seasonStats.triples + gameStats.triples,
                homeRuns: seasonStats.homeRuns + gameStats.homeRuns,
                strikeOuts: seasonStats.strikeOuts + gameStats.strikeOuts,
                baseOnBalls: seasonStats.baseOnBalls + gameStats.baseOnBalls,
                intentionalWalks: seasonStats.intentionalWalks + gameStats.intentionalWalks,
                hits: seasonStats.hits + gameStats.hits,
                hitByPitch: seasonStats.hitByPitch + gameStats.hitByPitch,
                atBats: seasonStats.atBats + gameStats.atBats,
                caughtStealing: seasonStats.caughtStealing + gameStats.caughtStealing,
                stolenBases: seasonStats.stolenBases + gameStats.stolenBases,
                numberOfPitches: seasonStats.numberOfPitches + gameStats.numberOfPitches,
                inningsPitched: seasonStats.inningsPitched + parseFloat(gameStats.inningsPitched),
                saveOpporunities: seasonStats.saveOpporunities + gameStats.saveOpportunities,
                earnedRuns: seasonStats.earnedRuns + gameStats.earnedRuns,
                battersFaced: seasonStats.battersFaced + gameStats.battersFaced,
                outs: seasonStats.outs + gameStats.outs,
                completeGames: seasonStats.completeGames + gameStats.completeGames,
                shutouts: seasonStats.shutouts + gameStats.shutouts,
                pitchesThrown: seasonStats.pitchesThrown + gameStats.pitchesThrown,
                balls: seasonStats.balls + gameStats.balls,
                strikes: seasonStats.strikes + gameStats.strikes,
                hitBatsmen: seasonStats.hitBatsmen + gameStats.hitBatsmen,
                balks: seasonStats.balks + gameStats.balks,
                wildPitches: seasonStats.wildPitches + gameStats.wildPitches,
                pickoffs: seasonStats.pickoffs + gameStats.pickoffs,
                rbi: seasonStats.rbi + gameStats.rbi,
                inheritedRunners: seasonStats.inheritedRunners + gameStats.inheritedRunners,
                inheritedRunnersScored: seasonStats.inheritedRunnersScored + gameStats.inheritedRunnersScored,
                catchersInterference: seasonStats.catchersInterference + gameStats.catchersInterference,
                sacBunts: seasonStats.sacBunts + gameStats.sacBunts,
                sacFlies: seasonStats.sacFlies + gameStats.sacFlies,
                passedBall: seasonStats.passedBall + gameStats.passedBall,
                popOuts: seasonStats.popOuts + gameStats.popOuts,
                lineOuts: seasonStats.lineOuts + gameStats.lineOuts,
            },
        });
    }
}

async function updateTeamSeasonFieldingStats(
    teamId: number,
    seasonId: number,
    gameStats: GameFieldingStatsTeam,
    tx: Prisma.TransactionClient,
) {
    // Get the current season stats or create a new one if it doesn't exist
    const seasonStats = await tx.teamSeasonFieldingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
        // Create a new season stats record if it doesn't exist
        await tx.teamSeasonFieldingStats.create({
            data: {
                teamId: teamId,
                seasonId: seasonId,
                gamesPlayed: 1,
                caughtStealing: gameStats.caughtStealing,
                stolenBases: gameStats.stolenBases,
                assists: gameStats.assists,
                putOuts: gameStats.putOuts,
                errors: gameStats.errors,
                chances: gameStats.chances,
                passedBall: gameStats.passedBall,
                pickOffs: gameStats.pickoffs,
            },
        });
    } else {
        // Update the existing season stats by adding the game stats
        await tx.teamSeasonFieldingStats.update({
            where: {
                teamId_seasonId: {
                    teamId: teamId,
                    seasonId: seasonId,
                },
            },
            data: {
                gamesPlayed: seasonStats.gamesPlayed + 1,
                caughtStealing: seasonStats.caughtStealing + gameStats.caughtStealing,
                stolenBases: seasonStats.stolenBases + gameStats.stolenBases,
                assists: seasonStats.assists + gameStats.assists,
                putOuts: seasonStats.putOuts + gameStats.putOuts,
                errors: seasonStats.errors + gameStats.errors,
                chances: seasonStats.chances + gameStats.chances,
                passedBall: seasonStats.passedBall + gameStats.passedBall,
                pickOffs: seasonStats.pickOffs + gameStats.pickoffs,
            },
        });
    }
}

async function updatePlayerStats(boxscore: Boxscore, game: GameDetails, existingGame: Game) {
    try {
        const playersByTeam = boxscore.teams;
        for (const teamKey of ["home", "away"] as const) {
            const players = playersByTeam[teamKey].players;
            for (const playerId in players) {
                const player = players[playerId];

                // Find the player in the database outside of the transaction
                const dbPlayer = await prisma.player.findUnique({
                    where: { mlb_api_id: player.person.id },
                });

                if (!dbPlayer) {
                    console.warn(`Player with ID ${player.person.id} not found in database.`);
                    continue;
                }

                // Process each player's stats in a separate transaction
                try {
                    // Check if player already has stats for this game
                    const existingPlayerGameBattingStats = await prisma.playerGameBattingStats.findUnique({
                        where: { playerId_gameId: { playerId: dbPlayer.id, gameId: existingGame.id } },
                    });
                    const existingPlayerGamePitchingStats = await prisma.playerGamePitchingStats.findUnique({
                        where: { playerId_gameId: { playerId: dbPlayer.id, gameId: existingGame.id } },
                    });

                    if (existingPlayerGameBattingStats || existingPlayerGamePitchingStats) {
                        console.log(
                            `Player ${dbPlayer.id} already has stats for game ${existingGame.id}. Skipping update.`,
                        );
                        continue;
                    }

                    // Process batting stats if available
                    if (
                        player.stats.batting &&
                        player.stats.batting !== undefined &&
                        Object.keys(player.stats.batting).length > 0
                    ) {
                        const battingStats = player.stats.batting as GameBatting;
                        await prisma
                            .$transaction(async (tx) => {
                                // Log game batting stats
                                await logPlayerGameBattingStats(dbPlayer.id, existingGame.id, battingStats, tx);
                            })
                            .catch((error) => {
                                console.error(
                                    `Error logging batting stats for player ${dbPlayer.id} in game ${existingGame.id}:`,
                                    error,
                                );
                            });

                        await prisma
                            .$transaction(async (tx) => {
                                // Update season batting stats
                                await updatePlayerSeasonBattingStats(
                                    dbPlayer.id,
                                    existingGame.season_id,
                                    battingStats,
                                    tx,
                                );
                            })
                            .catch((error) => {
                                console.error(`Error updating season batting stats for player ${dbPlayer.id}:`, error);
                            });
                    }

                    // Process pitching stats if available
                    if (
                        player.stats.pitching &&
                        player.stats.pitching !== undefined &&
                        Object.keys(player.stats.pitching).length > 0
                    ) {
                        const pitchingStats = player.stats.pitching as GamePitching;
                        await prisma
                            .$transaction(async (tx) => {
                                // Log game pitching stats
                                await logPlayerGamePitchingStats(pitchingStats, existingGame.id, dbPlayer.id, tx);
                            })
                            .catch((error) => {
                                console.error(
                                    `Error logging pitching stats for player ${dbPlayer.id} in game ${existingGame.id}:`,
                                    error,
                                );
                            });

                        await prisma
                            .$transaction(async (tx) => {
                                // Update season pitching stats
                                await updatePlayerSeasonPitchingStats(
                                    dbPlayer.id,
                                    existingGame.season_id,
                                    pitchingStats,
                                    tx,
                                );
                            })
                            .catch((error) => {
                                console.error(`Error updating season pitching stats for player ${dbPlayer.id}:`, error);
                            });
                    }
                } catch (error) {
                    console.error(
                        `Error processing stats for player ${dbPlayer.id} in game ${existingGame.id}:`,
                        error,
                    );
                }
            }
        }
    } catch (error) {
        console.error(`Error updating player game stats for game ${game.gamePk}:`, error);
    }
}

async function logPlayerGameBattingStats(
    playerId: number,
    gameId: number,
    gameStats: GameBatting,
    tx: Prisma.TransactionClient,
) {
    await tx.playerGameBattingStats.create({
        data: {
            playerId: playerId,
            gameId: gameId,
            summary: gameStats.summary,
            flyOuts: gameStats.flyOuts,
            groundOuts: gameStats.groundOuts,
            airOuts: gameStats.airOuts,
            runs: gameStats.runs,
            doubles: gameStats.doubles,
            triples: gameStats.triples,
            homeRuns: gameStats.homeRuns,
            strikeOuts: gameStats.strikeOuts,
            baseOnBalls: gameStats.baseOnBalls,
            intentionalWalks: gameStats.intentionalWalks,
            hits: gameStats.hits,
            hitByPitch: gameStats.hitByPitch,
            atBats: gameStats.atBats,
            caughtStealing: gameStats.caughtStealing,
            stolenBases: gameStats.stolenBases,
            groundIntoDoublePlay: gameStats.groundIntoDoublePlay,
            groundIntoTriplePlay: gameStats.groundIntoTriplePlay,
            plateAppearances: gameStats.plateAppearances,
            totalBases: gameStats.totalBases,
            rbi: gameStats.rbi,
            leftOnBase: gameStats.leftOnBase,
            sacBunts: gameStats.sacBunts,
            sacFlies: gameStats.sacFlies,
            catchersInterference: gameStats.catchersInterference,
            pickoffs: gameStats.pickoffs,
            popOuts: gameStats.popOuts,
            lineOuts: gameStats.lineOuts,
        },
    });
}

async function updatePlayerSeasonBattingStats(
    playerId: number,
    seasonId: number,
    gameStats: GameBatting,
    tx: Prisma.TransactionClient,
) {
    const seasonStats = await tx.playerSeasonBattingStats.findUnique({
        where: {
            playerId_seasonId: {
                playerId: playerId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
        await tx.playerSeasonBattingStats.create({
            data: {
                playerId: playerId,
                seasonId: seasonId,
                gamesPlayed: gameStats.gamesPlayed,
                flyOuts: gameStats.flyOuts,
                groundOuts: gameStats.groundOuts,
                airOuts: gameStats.airOuts,
                runs: gameStats.runs,
                doubles: gameStats.doubles,
                triples: gameStats.triples,
                homeRuns: gameStats.homeRuns,
                strikeOuts: gameStats.strikeOuts,
                baseOnBalls: gameStats.baseOnBalls,
                intentionalWalks: gameStats.intentionalWalks,
                hits: gameStats.hits,
                hitByPitch: gameStats.hitByPitch,
                atBats: gameStats.atBats,
                caughtStealing: gameStats.caughtStealing,
                stolenBases: gameStats.stolenBases,
                groundIntoDoublePlay: gameStats.groundIntoDoublePlay,
                groundIntoTriplePlay: gameStats.groundIntoTriplePlay,
                plateAppearances: gameStats.plateAppearances,
                totalBases: gameStats.totalBases,
                rbi: gameStats.rbi,
                leftOnBase: gameStats.leftOnBase,
                sacBunts: gameStats.sacBunts,
                sacFlies: gameStats.sacFlies,
                catchersInterference: gameStats.catchersInterference,
                pickoffs: gameStats.pickoffs,
                popOuts: gameStats.popOuts,
                lineOuts: gameStats.lineOuts,
            },
        });
    } else {
        await tx.playerSeasonBattingStats.update({
            where: {
                playerId_seasonId: {
                    playerId: playerId,
                    seasonId: seasonId,
                },
            },
            data: {
                gamesPlayed: seasonStats.gamesPlayed + gameStats.gamesPlayed,
                flyOuts: seasonStats.flyOuts + gameStats.flyOuts,
                groundOuts: seasonStats.groundOuts + gameStats.groundOuts,
                airOuts: seasonStats.airOuts + gameStats.airOuts,
                runs: seasonStats.runs + gameStats.runs,
                doubles: seasonStats.doubles + gameStats.doubles,
                triples: seasonStats.triples + gameStats.triples,
                homeRuns: seasonStats.homeRuns + gameStats.homeRuns,
                strikeOuts: seasonStats.strikeOuts + gameStats.strikeOuts,
                baseOnBalls: seasonStats.baseOnBalls + gameStats.baseOnBalls,
                intentionalWalks: seasonStats.intentionalWalks + gameStats.intentionalWalks,
                hits: seasonStats.hits + gameStats.hits,
                hitByPitch: seasonStats.hitByPitch + gameStats.hitByPitch,
                atBats: seasonStats.atBats + gameStats.atBats,
                caughtStealing: seasonStats.caughtStealing + gameStats.caughtStealing,
                stolenBases: seasonStats.stolenBases + gameStats.stolenBases,
                groundIntoDoublePlay: seasonStats.groundIntoDoublePlay + gameStats.groundIntoDoublePlay,
                groundIntoTriplePlay: seasonStats.groundIntoTriplePlay + gameStats.groundIntoTriplePlay,
                plateAppearances: seasonStats.plateAppearances + gameStats.plateAppearances,
                totalBases: seasonStats.totalBases + gameStats.totalBases,
                rbi: seasonStats.rbi + gameStats.rbi,
                leftOnBase: seasonStats.leftOnBase + gameStats.leftOnBase,
                sacBunts: seasonStats.sacBunts + gameStats.sacBunts,
                sacFlies: seasonStats.sacFlies + gameStats.sacFlies,
                catchersInterference: seasonStats.catchersInterference + gameStats.catchersInterference,
                pickoffs: seasonStats.pickoffs + gameStats.pickoffs,
                popOuts: seasonStats.popOuts + gameStats.popOuts,
                lineOuts: seasonStats.lineOuts + gameStats.lineOuts,
            },
        });
    }
}

async function logPlayerGamePitchingStats(
    gameStats: GamePitching,
    gameId: number,
    playerId: number,
    tx: Prisma.TransactionClient,
) {
    await tx.playerGamePitchingStats.create({
        data: {
            playerId: playerId,
            gameId: gameId,
            decision:
                gameStats.wins === 1
                    ? PitcherDecision.WIN
                    : gameStats.losses === 1
                    ? PitcherDecision.LOSS
                    : gameStats.saves === 1
                    ? PitcherDecision.SAVE
                    : gameStats.holds === 1
                    ? PitcherDecision.HOLD
                    : PitcherDecision.NO_DECISION,
            summary: gameStats.summary,
            gamesPlayed: gameStats.gamesPlayed,
            gamesStarted: gameStats.gamesStarted,
            flyouts: gameStats.flyOuts,
            groundOuts: gameStats.groundOuts,
            airOuts: gameStats.airOuts,
            runs: gameStats.runs,
            doubles: gameStats.doubles,
            triples: gameStats.triples,
            homeRuns: gameStats.homeRuns,
            strikeOuts: gameStats.strikeOuts,
            baseOnBalls: gameStats.baseOnBalls,
            intentionalWalks: gameStats.intentionalWalks,
            hits: gameStats.hits,
            hitByPitch: gameStats.hitByPitch,
            atBats: gameStats.atBats,
            caughtStealing: gameStats.caughtStealing,
            stolenBases: gameStats.stolenBases,
            numberOfPitches: gameStats.numberOfPitches,
            inningsPitched: parseFloat(gameStats.inningsPitched),
            wins: gameStats.wins,
            losses: gameStats.losses,
            saves: gameStats.saves,
            saveOpporunities: gameStats.saveOpportunities,
            holds: gameStats.holds,
            blownSaves: gameStats.blownSaves,
            earnedRuns: gameStats.earnedRuns,
            battersFaced: gameStats.battersFaced,
            outs: gameStats.outs,
            completeGames: gameStats.completeGames,
            shutouts: gameStats.shutouts,
            pitchesThrown: gameStats.pitchesThrown,
            balls: gameStats.balls,
            strikes: gameStats.strikes,
            hitBatsmen: gameStats.hitBatsmen,
            balks: gameStats.balks,
            wildPitches: gameStats.wildPitches,
            pickoffs: gameStats.pickoffs,
            rbi: gameStats.rbi,
            gamesFinished: gameStats.gamesFinished,
            inheritedRunners: gameStats.inheritedRunners,
            inheritedRunnersScored: gameStats.inheritedRunnersScored,
            catchersInterference: gameStats.catchersInterference,
            sacBunts: gameStats.sacBunts,
            sacFlies: gameStats.sacFlies,
            passedBall: gameStats.passedBall,
            popOuts: gameStats.popOuts,
            lineOuts: gameStats.lineOuts,
            pitchingScore:
                47.4 +
                1.5 * gameStats.outs +
                gameStats.strikeOuts -
                2 * gameStats.baseOnBalls -
                2 * gameStats.hits -
                3 * gameStats.runs -
                4 * gameStats.homeRuns,
        },
    });
}

async function updatePlayerSeasonPitchingStats(
    playerId: number,
    seasonId: number,
    gameStats: GamePitching,
    tx: Prisma.TransactionClient,
) {
    const seasonStats = await tx.playerSeasonPitchingStats.findUnique({
        where: {
            playerId_seasonId: {
                playerId: playerId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
        await tx.playerSeasonPitchingStats.create({
            data: {
                playerId: playerId,
                seasonId: seasonId,
                gamesPlayed: gameStats.gamesPlayed,
                gamesStarted: gameStats.gamesStarted,
                flyouts: gameStats.flyOuts,
                groundOuts: gameStats.groundOuts,
                airOuts: gameStats.airOuts,
                runs: gameStats.runs,
                doubles: gameStats.doubles,
                triples: gameStats.triples,
                homeRuns: gameStats.homeRuns,
                strikeOuts: gameStats.strikeOuts,
                baseOnBalls: gameStats.baseOnBalls,
                intentionalWalks: gameStats.intentionalWalks,
                hits: gameStats.hits,
                hitByPitch: gameStats.hitByPitch,
                atBats: gameStats.atBats,
                caughtStealing: gameStats.caughtStealing,
                stolenBases: gameStats.stolenBases,
                numberOfPitches: gameStats.numberOfPitches,
                inningsPitched: parseFloat(gameStats.inningsPitched),
                wins: gameStats.wins,
                losses: gameStats.losses,
                saves: gameStats.saves,
                saveOpporunities: gameStats.saveOpportunities,
                holds: gameStats.holds,
                blownSaves: gameStats.blownSaves,
                earnedRuns: gameStats.earnedRuns,
                battersFaced: gameStats.battersFaced,
                outs: gameStats.outs,
                completeGames: gameStats.completeGames,
                shutouts: gameStats.shutouts,
                pitchesThrown: gameStats.pitchesThrown,
                balls: gameStats.balls,
                strikes: gameStats.strikes,
                hitBatsmen: gameStats.hitBatsmen,
                balks: gameStats.balks,
                wildPitches: gameStats.wildPitches,
                pickoffs: gameStats.pickoffs,
                rbi: gameStats.rbi,
                gamesFinished: gameStats.gamesFinished,
                inheritedRunners: gameStats.inheritedRunners,
                inheritedRunnersScored: gameStats.inheritedRunnersScored,
                catchersInterference: gameStats.catchersInterference,
                sacBunts: gameStats.sacBunts,
                sacFlies: gameStats.sacFlies,
                passedBall: gameStats.passedBall,
                popOuts: gameStats.popOuts,
                lineOuts: gameStats.lineOuts,
                runningPitcherScore:
                    47.4 +
                    1.5 * gameStats.outs +
                    gameStats.strikeOuts -
                    2 * gameStats.baseOnBalls -
                    2 * gameStats.hits -
                    3 * gameStats.runs -
                    4 * gameStats.homeRuns,
            },
        });
    } else {
        await tx.playerSeasonPitchingStats.update({
            where: {
                playerId_seasonId: {
                    playerId: playerId,
                    seasonId: seasonId,
                },
            },
            data: {
                gamesPlayed: seasonStats.gamesPlayed + gameStats.gamesPlayed,
                gamesStarted: seasonStats.gamesStarted + gameStats.gamesStarted,
                flyouts: seasonStats.flyouts + gameStats.flyOuts,
                groundOuts: seasonStats.groundOuts + gameStats.groundOuts,
                airOuts: seasonStats.airOuts + gameStats.airOuts,
                runs: seasonStats.runs + gameStats.runs,
                doubles: seasonStats.doubles + gameStats.doubles,
                triples: seasonStats.triples + gameStats.triples,
                homeRuns: seasonStats.homeRuns + gameStats.homeRuns,
                strikeOuts: seasonStats.strikeOuts + gameStats.strikeOuts,
                baseOnBalls: seasonStats.baseOnBalls + gameStats.baseOnBalls,
                intentionalWalks: seasonStats.intentionalWalks + gameStats.intentionalWalks,
                hits: seasonStats.hits + gameStats.hits,
                hitByPitch: seasonStats.hitByPitch + gameStats.hitByPitch,
                atBats: seasonStats.atBats + gameStats.atBats,
                caughtStealing: seasonStats.caughtStealing + gameStats.caughtStealing,
                stolenBases: seasonStats.stolenBases + gameStats.stolenBases,
                numberOfPitches: seasonStats.numberOfPitches + gameStats.numberOfPitches,
                inningsPitched: seasonStats.inningsPitched + parseFloat(gameStats.inningsPitched),
                wins: seasonStats.wins + gameStats.wins,
                losses: seasonStats.losses + gameStats.losses,
                saves: seasonStats.saves + gameStats.saves,
                saveOpporunities: seasonStats.saveOpporunities + gameStats.saveOpportunities,
                holds: seasonStats.holds + gameStats.holds,
                blownSaves: seasonStats.blownSaves + gameStats.blownSaves,
                earnedRuns: seasonStats.earnedRuns + gameStats.earnedRuns,
                battersFaced: seasonStats.battersFaced + gameStats.battersFaced,
                outs: seasonStats.outs + gameStats.outs,
                completeGames: seasonStats.completeGames + gameStats.completeGames,
                shutouts: seasonStats.shutouts + gameStats.shutouts,
                pitchesThrown: seasonStats.pitchesThrown + gameStats.pitchesThrown,
                balls: seasonStats.balls + gameStats.balls,
                strikes: seasonStats.strikes + gameStats.strikes,
                hitBatsmen: seasonStats.hitBatsmen + gameStats.hitBatsmen,
                balks: seasonStats.balks + gameStats.balks,
                wildPitches: seasonStats.wildPitches + gameStats.wildPitches,
                pickoffs: seasonStats.pickoffs + gameStats.pickoffs,
                rbi: seasonStats.rbi + gameStats.rbi,
                gamesFinished: seasonStats.gamesFinished + gameStats.gamesFinished,
                inheritedRunners: seasonStats.inheritedRunners + gameStats.inheritedRunners,
                inheritedRunnersScored: seasonStats.inheritedRunnersScored + gameStats.inheritedRunnersScored,
                catchersInterference: seasonStats.catchersInterference + gameStats.catchersInterference,
                sacBunts: seasonStats.sacBunts + gameStats.sacBunts,
                sacFlies: seasonStats.sacFlies + gameStats.sacFlies,
                passedBall: seasonStats.passedBall + gameStats.passedBall,
                popOuts: seasonStats.popOuts + gameStats.popOuts,
                lineOuts: seasonStats.lineOuts + gameStats.lineOuts,
                runningPitcherScore:
                    seasonStats.runningPitcherScore ??
                    0.0 +
                        (47.4 +
                            1.5 * gameStats.outs +
                            gameStats.strikeOuts -
                            2 * gameStats.baseOnBalls -
                            2 * gameStats.hits -
                            3 * gameStats.runs -
                            4 * gameStats.homeRuns) /
                            (seasonStats.gamesPlayed + gameStats.gamesPlayed),
            },
        });
    }
}

getGameResults();
