import { prisma } from "@/lib/prisma";

const seasonPitchingInclude = {
    PlayerSeasonPitchingStats: {
        select: {
            gamesPlayed: true,
            gamesStarted: true,
            wins: true,
            losses: true,
            earnedRuns: true,
            inningsPitched: true,
            outs: true,
            baseOnBalls: true,
            hits: true,
            strikeOuts: true,
            runningPitcherScore: true,
        },
    },
} as const;

export async function getGameDetail(id: number) {
    const game = await prisma.game.findUnique({
        where: { id },
        include: {
            homeTeam: true,
            awayTeam: true,
            homeStartingPitcher: { include: seasonPitchingInclude },
            awayStartingPitcher: { include: seasonPitchingInclude },
            InningDetails: { orderBy: { inning: "asc" } },
            PlayerGamePitchingStats: {
                where: { gamesStarted: 1 },
                select: {
                    playerId: true,
                    summary: true,
                    decision: true,
                    pitchingScore: true,
                    inningsPitched: true,
                },
            },
            PlayerGameBattingStats: {
                select: {
                    playerId: true,
                    atBats: true,
                    hits: true,
                    homeRuns: true,
                    strikeOuts: true,
                    rbi: true,
                    player: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            position: true,
                            uniformNumber: true,
                            teamId: true,
                        },
                    },
                },
            },
        },
    });

    if (!game) return null;

    const allLineupIds = [...(game.battingOrderHome || []), ...(game.battingOrderAway || [])];
    const players = allLineupIds.length
        ? await prisma.player.findMany({
              where: { id: { in: allLineupIds } },
              include: {
                  PlayerSeasonBattingStats: {
                      where: { seasonId: game.season_id },
                      select: {
                          hits: true,
                          atBats: true,
                          baseOnBalls: true,
                          hitByPitch: true,
                          sacFlies: true,
                          homeRuns: true,
                          rbi: true,
                      },
                  },
              },
          })
        : [];
    const playerMap = new Map(players.map((player) => [player.id, player]));
    const orderedHomePlayers = game.battingOrderHome?.map((pid) => playerMap.get(pid) || null) ?? [];
    const orderedAwayPlayers = game.battingOrderAway?.map((pid) => playerMap.get(pid) || null) ?? [];

    const homeOrderSet = new Set(game.battingOrderHome ?? []);
    const awayOrderSet = new Set(game.battingOrderAway ?? []);
    const homeSubs = game.PlayerGameBattingStats.filter(
        (s) => s.player.teamId === game.homeTeamId && !homeOrderSet.has(s.playerId),
    );
    const awaySubs = game.PlayerGameBattingStats.filter(
        (s) => s.player.teamId === game.awayTeamId && !awayOrderSet.has(s.playerId),
    );
    const gameBattingByPlayerId = new Map(
        game.PlayerGameBattingStats.map((s) => [s.playerId, s]),
    );

    return {
        game,
        orderedHomePlayers,
        orderedAwayPlayers,
        homeSubs,
        awaySubs,
        gameBattingByPlayerId,
    };
}

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameDetail>>>;
export type GameWithRelations = GameDetail["game"];
export type GamePitcher = GameWithRelations["awayStartingPitcher"];
export type LineupPlayer = GameDetail["orderedHomePlayers"][number];
export type GamePitcherStats = GameWithRelations["PlayerGamePitchingStats"][number];
export type GameBatterStats = GameWithRelations["PlayerGameBattingStats"][number];
