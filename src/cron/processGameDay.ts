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

export const prisma = new PrismaClient();

async function getGamesForDay(date: string): Promise<GameDetails[]> {
    console.log(`Fetching games for ${date}`);
    const { data }: { data: ScheduleData } = await axios.get(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${date}&endDate=${date}&gameType=R`,
    );

    return data.dates.flatMap((d) => d.games);
}

export async function getGameResults(date: string) {
    try {
        const games = await getGamesForDay(date);
        console.log(`Found ${games.length} games for ${date}.`);
        for (const game of games) {
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });
            if (!existingGame) {
                console.log(`Game ${game.gamePk} not found in database.`);
                continue;
            }

            if (existingGame.status === GameStatus.FINAL) {
                console.log(`Game ${game.gamePk} already processed.`);
                continue;
            }

            if (game.status.codedGameState === "D") {
                if (game.rescheduleDate !== undefined) {
                    await prisma
                        .$transaction(async (tx) => {
                            await updateDelayedGameDate(game, tx);
                        })
                        .catch((error) => {
                            console.error(`Error updating delayed game date for game ${game.gamePk}:`, error);
                        });
                }

                console.log(`Game ${game.gamePk} is delayed until ${game.rescheduleDate}. Skipping update.`);
                continue;
            }

            if (game.status.codedGameState !== "F") {
                console.log(`Game ${game.gamePk} is not final yet. Has status ${game.status.statusCode}.`);
                continue;
            }

            try {
                const { data }: { data: GameData } = await axios.get(
                    `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`,
                );
                const { liveData } = data;

                const homeTeamRuns = liveData.linescore.teams.home.runs;
                const awayTeamRuns = liveData.linescore.teams.away.runs;
                const homeTeamWon = homeTeamRuns > awayTeamRuns;
                const winningTeamId = homeTeamWon ? existingGame.homeTeamId : existingGame.awayTeamId;

                await prisma
                    .$transaction(async (tx) => {
                        await insertInningDetails(liveData.linescore.innings, existingGame.id, game.gamePk, tx);
                    })
                    .catch((error) => {
                        console.error(`Error inserting inning details for game ${game.gamePk}:`, error);
                    });

                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamRecords(winningTeamId, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team records for game ${game.gamePk}:`, error);
                    });

                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamElo(awayTeamRuns, homeTeamRuns, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team ELO for game ${game.gamePk}:`, error);
                    });

                await updatePlayerStats(liveData.boxscore, game, existingGame).catch((error) => {
                    console.error(`Error updating player stats for game ${game.gamePk}:`, error);
                });

                await prisma
                    .$transaction(async (tx) => {
                        await updateStartingLineups(liveData.boxscore, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error setting starting lineups for game ${game.gamePk}:`, error);
                    });

                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamGameStats(liveData.boxscore, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team game stats for game ${game.gamePk}:`, error);
                    });

                await prisma
                    .$transaction(async (tx) => {
                        await updateTeamSeasonStats(liveData.boxscore, game, existingGame, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating team season stats for game ${game.gamePk}:`, error);
                    });

                // Mark FINAL last so any earlier crash leaves the game looking
                // unprocessed on re-run and the top-of-loop guard retries it.
                await prisma
                    .$transaction(async (tx) => {
                        await updateFinalScoreAndStatus(awayTeamRuns, homeTeamRuns, winningTeamId, game, tx);
                    })
                    .catch((error) => {
                        console.error(`Error updating final score for game ${game.gamePk}:`, error);
                    });

                console.log(`Successfully processed game ${game.gamePk}`);
            } catch (error) {
                console.error(`Error processing game ${game.gamePk}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error updating game results for ${date}:`, error);
    } finally {
        console.log(`Completed getGameResults for ${date}`);
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
                status: game.status.codedGameState === "F" ? GameStatus.FINAL : GameStatus.SCHEDULED,
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

async function updateDelayedGameDate(game: GameDetails, tx: Prisma.TransactionClient) {
    try {
        if (!game.rescheduleDate) {
            console.error(`Game ${game.gamePk} has no reschedule date.`);
            return;
        }

        const existingGame = await tx.game.findUnique({
            where: { mlb_api_id: game.gamePk },
        });

        if (!existingGame) {
            console.error(`Game ${game.gamePk} not found in database.`);
            return;
        }

        const rescheduleDate = new Date(game.rescheduleDate);
        console.log(existingGame.date.getTime(), rescheduleDate.getTime());

        if (existingGame.date.getTime() === rescheduleDate.getTime()) {
            console.log(`Game ${game.gamePk} already has the correct reschedule date.`);
            return;
        }

        await tx.game.update({
            where: { id: existingGame.id },
            data: {
                date: rescheduleDate,
            },
        });

        console.log(`Updated game ${game.gamePk} reschedule date to ${rescheduleDate}`);
    } catch (error) {
        console.error(`Error updating delayed game date for game ${game.gamePk}:`, error);
    }
}

async function updateStartingLineups(
    boxscore: Boxscore,
    game: GameDetails,
    existingGame: Game,
    tx: Prisma.TransactionClient,
) {
    try {
        const homeOrder = boxscore.teams.home.battingOrder ?? [];
        const awayOrder = boxscore.teams.away.battingOrder ?? [];
        const homeStarterApi = boxscore.teams.home.pitchers?.[0];
        const awayStarterApi = boxscore.teams.away.pitchers?.[0];

        const allApiIds = Array.from(
            new Set([
                ...homeOrder,
                ...awayOrder,
                ...(homeStarterApi !== undefined ? [homeStarterApi] : []),
                ...(awayStarterApi !== undefined ? [awayStarterApi] : []),
            ]),
        );

        if (allApiIds.length === 0) return;

        const players = await tx.player.findMany({
            where: { mlb_api_id: { in: allApiIds } },
            select: { id: true, mlb_api_id: true },
        });
        const apiToLocal = new Map(players.map((p) => [p.mlb_api_id!, p.id]));

        const mapOrder = (apiOrder: number[]) =>
            apiOrder
                .map((apiId) => apiToLocal.get(apiId))
                .filter((id): id is number => id !== undefined);

        await tx.game.update({
            where: { id: existingGame.id },
            data: {
                startingPitcherHomeId:
                    homeStarterApi !== undefined ? apiToLocal.get(homeStarterApi) ?? null : null,
                startingPitcherAwayId:
                    awayStarterApi !== undefined ? apiToLocal.get(awayStarterApi) ?? null : null,
                battingOrderHome: mapOrder(homeOrder),
                battingOrderAway: mapOrder(awayOrder),
            },
        });

        console.log(`Set lineups for game ${game.gamePk}`);
    } catch (error) {
        console.error(`Error setting starting lineups for game ${game.gamePk}:`, error);
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
        const teamRecords = await tx.teamRecord.findMany({
            where: {
                seasonId: existingGame.season_id,
                teamId: { in: [existingGame.homeTeamId, existingGame.awayTeamId] },
            },
        });

        if (teamRecords.length !== 2) {
            console.error(`Expected 2 team records for game ${game.gamePk}, but found ${teamRecords.length}`);
            return;
        }

        for (const record of teamRecords) {
            const isHomeTeam = record.teamId === existingGame.homeTeamId;
            const isWinner = record.teamId === winningTeamId;

            await tx.teamRecord.update({
                where: { teamId_seasonId: { teamId: record.teamId, seasonId: existingGame.season_id } },
                data: {
                    wins: isWinner ? record.wins + 1 : record.wins,
                    losses: !isWinner ? record.losses + 1 : record.losses,
                    homeWins: isHomeTeam && isWinner ? record.homeWins + 1 : record.homeWins,
                    homeLosses: isHomeTeam && !isWinner ? record.homeLosses + 1 : record.homeLosses,
                    awayWins: !isHomeTeam && isWinner ? record.awayWins + 1 : record.awayWins,
                    awayLosses: !isHomeTeam && !isWinner ? record.awayLosses + 1 : record.awayLosses,
                },
            });
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
        const teamELOs = await tx.teamELO.findMany({
            where: {
                seasonId: existingGame.season_id,
                teamId: { in: [existingGame.homeTeamId, existingGame.awayTeamId] },
            },
        });

        const homeElo = teamELOs.find((elo) => elo.teamId === existingGame.homeTeamId);
        const awayElo = teamELOs.find((elo) => elo.teamId === existingGame.awayTeamId);

        if (!homeElo || !awayElo) {
            console.error(`Expected 2 team ELO records for game ${game.gamePk}, but found ${teamELOs.length}`);
            return;
        }

        const eloData = updateElo({
            homeElo: homeElo.elo,
            awayElo: awayElo.elo,
            homeScore: homeTeamRuns,
            awayScore: awayTeamRuns,
            isPlayoff: existingGame.isPostseason,
            isNeutral: existingGame.isNeutralSite,
        });

        for (const elo of teamELOs) {
            const isHomeTeam = elo.teamId === existingGame.homeTeamId;

            await tx.teamELO.update({
                where: { teamId_seasonId: { teamId: elo.teamId, seasonId: elo.seasonId } },
                data: {
                    elo: isHomeTeam ? eloData.newHomeElo : eloData.newAwayElo,
                    eloChange: isHomeTeam ? elo.eloChange + eloData.eloChange : elo.eloChange + -eloData.eloChange,
                },
            });
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

            if (battingstats) await updateTeamSeasonBattingStats(teamId, existingGame.season_id, battingstats, tx);
            if (pitchingStats) await updateTeamSeasonPitchingStats(teamId, existingGame.season_id, pitchingStats, tx);
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
    const seasonStats = await tx.teamSeasonBattingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
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
    const seasonStats = await tx.teamSeasonPitchingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
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

    const starterScores = await tx.playerGamePitchingStats.findMany({
        where: {
            gamesStarted: 1,
            pitchingScore: { not: null },
            player: { teamId: teamId },
            game: { season_id: seasonId, status: GameStatus.FINAL },
        },
        select: { pitchingScore: true },
    });

    const teamPitchingScore =
        starterScores.length > 0
            ? starterScores.reduce((acc, s) => acc + (s.pitchingScore ?? 0), 0) / starterScores.length
            : null;

    await tx.teamSeasonPitchingStats.update({
        where: { teamId_seasonId: { teamId, seasonId } },
        data: { teamPitchingScore },
    });
}

async function updateTeamSeasonFieldingStats(
    teamId: number,
    seasonId: number,
    gameStats: GameFieldingStatsTeam,
    tx: Prisma.TransactionClient,
) {
    const seasonStats = await tx.teamSeasonFieldingStats.findUnique({
        where: {
            teamId_seasonId: {
                teamId: teamId,
                seasonId: seasonId,
            },
        },
    });

    if (!seasonStats) {
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

                let dbPlayer = await prisma.player.findUnique({
                    where: { mlb_api_id: player.person.id },
                });

                if (!dbPlayer) {
                    dbPlayer = await fetchAndCreatePlayer(
                        player.person.id,
                        teamKey === "home" ? existingGame.homeTeamId : existingGame.awayTeamId,
                    );
                    if (!dbPlayer) {
                        console.warn(`Could not fetch/create player ${player.person.id}; skipping.`);
                        continue;
                    }
                    console.log(`Auto-created player ${player.person.id} (${dbPlayer.firstName} ${dbPlayer.lastName}).`);
                }

                try {
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

                    if (
                        player.stats.batting &&
                        player.stats.batting !== undefined &&
                        Object.keys(player.stats.batting).length > 0
                    ) {
                        const battingStats = player.stats.batting as GameBatting;
                        await prisma
                            .$transaction(async (tx) => {
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

                    if (
                        player.stats.pitching &&
                        player.stats.pitching !== undefined &&
                        Object.keys(player.stats.pitching).length > 0
                    ) {
                        const pitchingStats = player.stats.pitching as GamePitching;
                        await prisma
                            .$transaction(async (tx) => {
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
                gameStats.gamesStarted === 1
                    ? 47.4 +
                      1.5 * gameStats.outs +
                      gameStats.strikeOuts -
                      2 * gameStats.baseOnBalls -
                      2 * gameStats.hits -
                      3 * gameStats.runs -
                      4 * gameStats.homeRuns
                    : null,
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
                    gameStats.gamesStarted === 1
                        ? 47.4 +
                          1.5 * gameStats.outs +
                          gameStats.strikeOuts -
                          2 * gameStats.baseOnBalls -
                          2 * gameStats.hits -
                          3 * gameStats.runs -
                          4 * gameStats.homeRuns
                        : 0,
            },
        });
    } else {
        const pitchingScores = await tx.playerGamePitchingStats.findMany({
            where: {
                playerId: playerId,
                gamesStarted: 1,
            },
            select: { pitchingScore: true },
        });

        const averagePitchingScore =
            pitchingScores && pitchingScores.length > 0
                ? pitchingScores.reduce((acc, stat) => acc + (stat.pitchingScore || 0), 0) / pitchingScores.length
                : 0;

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
                runningPitcherScore: averagePitchingScore,
            },
        });
    }
}

async function fetchAndCreatePlayer(mlbApiId: number, teamId: number) {
    try {
        const { data } = await axios.get(`https://statsapi.mlb.com/api/v1/people/${mlbApiId}`);
        const person = data.people?.[0];
        if (!person) return null;

        const parsedNumber = person.primaryNumber ? parseInt(person.primaryNumber, 10) : null;
        const uniformNumber = parsedNumber === null || Number.isNaN(parsedNumber) ? null : parsedNumber;

        return await prisma.player.upsert({
            where: { mlb_api_id: mlbApiId },
            update: {},
            create: {
                mlb_api_id: mlbApiId,
                firstName: person.firstName ?? "",
                lastName: person.lastName ?? "",
                position: person.primaryPosition?.abbreviation ?? "",
                uniformNumber,
                photoUrl: `https://midfield.mlbstatic.com/v1/people/${mlbApiId}/spots/120`,
                teamId,
            },
        });
    } catch (error) {
        console.error(`Failed to fetch player ${mlbApiId} from MLB API:`, error);
        return null;
    }
}
