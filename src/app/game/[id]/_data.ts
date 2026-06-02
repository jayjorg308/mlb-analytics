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
        },
    });

    if (!game) return null;

    const allLineupIds = [...(game.battingOrderHome || []), ...(game.battingOrderAway || [])];
    const players = allLineupIds.length
        ? await prisma.player.findMany({ where: { id: { in: allLineupIds } } })
        : [];
    const playerMap = new Map(players.map((player) => [player.id, player]));
    const orderedHomePlayers = game.battingOrderHome?.map((pid) => playerMap.get(pid) || null) ?? [];
    const orderedAwayPlayers = game.battingOrderAway?.map((pid) => playerMap.get(pid) || null) ?? [];

    return { game, orderedHomePlayers, orderedAwayPlayers };
}

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGameDetail>>>;
export type GameWithRelations = GameDetail["game"];
export type GamePitcher = GameWithRelations["awayStartingPitcher"];
export type LineupPlayer = GameDetail["orderedHomePlayers"][number];
export type GamePitcherStats = GameWithRelations["PlayerGamePitchingStats"][number];
