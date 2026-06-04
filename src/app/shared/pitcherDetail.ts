import { GameStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPitcherStats } from "@/app/shared/statCalcUtils";
import type {
    PitcherSeasonSummary,
    PitcherStart,
} from "@/app/components/PitcherSeasonScoreChart";

export type PitcherDetailPitcher = {
    id: number;
    firstName: string;
    lastName: string;
    teamId: number | null;
    photoUrl: string | null;
    uniformNumber: number | null;
    position: string;
};

export type PitcherDetailTeam = {
    id: number;
    name: string;
    abbreviation: string;
    logoUrl: string;
} | null;

export type PitcherDetail = {
    pitcher: PitcherDetailPitcher;
    team: PitcherDetailTeam;
    season: PitcherSeasonSummary | null;
    starts: PitcherStart[];
};

export async function getPitcherDetail(pitcherId: number): Promise<PitcherDetail | null> {
    const player = await prisma.player.findUnique({
        where: { id: pitcherId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            teamId: true,
            photoUrl: true,
            uniformNumber: true,
            position: true,
            team: {
                select: { id: true, name: true, abbreviation: true, logo_url: true },
            },
        },
    });

    if (!player) return null;

    const seasonStats = await prisma.playerSeasonPitchingStats.findFirst({
        where: { playerId: pitcherId },
        orderBy: { seasonId: "desc" },
    });

    const seasonId = seasonStats?.seasonId;

    const startsRaw = await prisma.playerGamePitchingStats.findMany({
        where: {
            playerId: pitcherId,
            gamesStarted: 1,
            pitchingScore: { not: null },
            ...(seasonId ? { game: { season_id: seasonId } } : {}),
        },
        select: {
            gameId: true,
            decision: true,
            pitchingScore: true,
            inningsPitched: true,
            strikeOuts: true,
            baseOnBalls: true,
            hits: true,
            runs: true,
            homeRuns: true,
            game: {
                select: {
                    date: true,
                    homeTeamId: true,
                    awayTeamId: true,
                    homeTeam: {
                        select: { id: true, name: true, abbreviation: true, logo_url: true },
                    },
                    awayTeam: {
                        select: { id: true, name: true, abbreviation: true, logo_url: true },
                    },
                },
            },
        },
        orderBy: { game: { date: "asc" } },
    });

    const startMeta = startsRaw.map((s) => {
        const isHome = player.teamId != null && s.game.homeTeamId === player.teamId;
        const opponentTeam = isHome ? s.game.awayTeam : s.game.homeTeam;
        return { raw: s, isHome, opponentTeam, opponentId: opponentTeam.id };
    });

    const opponentRecords = await computeOpponentRecordsEntering(
        startMeta.map((m) => ({ opponentId: m.opponentId, date: m.raw.game.date })),
        seasonId,
    );

    const starts: PitcherStart[] = startMeta.map(({ raw, isHome, opponentTeam, opponentId }, idx) => {
        const key = recordKey(opponentId, raw.game.date);
        return {
            gameId: raw.gameId,
            date: raw.game.date.toISOString(),
            startNumber: idx + 1,
            pitchingScore: raw.pitchingScore as number,
            decision: raw.decision,
            inningsPitched: raw.inningsPitched,
            strikeOuts: raw.strikeOuts,
            baseOnBalls: raw.baseOnBalls,
            hits: raw.hits,
            runs: raw.runs,
            homeRuns: raw.homeRuns,
            opponent: {
                id: opponentTeam.id,
                name: opponentTeam.name,
                abbreviation: opponentTeam.abbreviation,
                logoUrl: opponentTeam.logo_url,
            },
            isHome,
            opponentRecordEntering: opponentRecords.get(key) ?? { wins: 0, losses: 0 },
        };
    });

    const season: PitcherSeasonSummary | null = seasonStats
        ? (() => {
              const { era, whip } = getPitcherStats(
                  seasonStats.earnedRuns,
                  seasonStats.baseOnBalls,
                  seasonStats.hits,
                  seasonStats.outs,
              );
              return {
                  seasonAverageScore: seasonStats.runningPitcherScore,
                  wins: seasonStats.wins,
                  losses: seasonStats.losses,
                  gamesStarted: seasonStats.gamesStarted,
                  inningsPitched: seasonStats.inningsPitched,
                  strikeOuts: seasonStats.strikeOuts,
                  baseOnBalls: seasonStats.baseOnBalls,
                  hits: seasonStats.hits,
                  earnedRuns: seasonStats.earnedRuns,
                  homeRuns: seasonStats.homeRuns,
                  era,
                  whip,
              };
          })()
        : null;

    return {
        pitcher: {
            id: player.id,
            firstName: player.firstName,
            lastName: player.lastName,
            teamId: player.teamId,
            photoUrl: player.photoUrl || null,
            uniformNumber: player.uniformNumber,
            position: player.position,
        },
        team: player.team
            ? {
                  id: player.team.id,
                  name: player.team.name,
                  abbreviation: player.team.abbreviation,
                  logoUrl: player.team.logo_url,
              }
            : null,
        season,
        starts,
    };
}

function recordKey(opponentId: number, date: Date): string {
    return `${opponentId}|${date.toISOString()}`;
}

async function computeOpponentRecordsEntering(
    queries: { opponentId: number; date: Date }[],
    seasonId: number | undefined,
): Promise<Map<string, { wins: number; losses: number }>> {
    const result = new Map<string, { wins: number; losses: number }>();
    if (queries.length === 0 || seasonId == null) return result;

    const opponentIds = Array.from(new Set(queries.map((q) => q.opponentId)));
    const latestDate = queries.reduce(
        (acc, q) => (q.date > acc ? q.date : acc),
        queries[0].date,
    );

    const opponentGames = await prisma.game.findMany({
        where: {
            season_id: seasonId,
            status: GameStatus.FINAL,
            date: { lt: latestDate },
            OR: [
                { homeTeamId: { in: opponentIds } },
                { awayTeamId: { in: opponentIds } },
            ],
        },
        select: { date: true, homeTeamId: true, awayTeamId: true, winningTeamId: true },
        orderBy: { date: "asc" },
    });

    const perTeam = new Map<number, { date: Date; wonByOpponent: boolean }[]>();
    for (const id of opponentIds) perTeam.set(id, []);
    for (const g of opponentGames) {
        for (const id of [g.homeTeamId, g.awayTeamId]) {
            const arr = perTeam.get(id);
            if (!arr) continue;
            arr.push({ date: g.date, wonByOpponent: g.winningTeamId === id });
        }
    }

    for (const { opponentId, date } of queries) {
        const arr = perTeam.get(opponentId) ?? [];
        let wins = 0;
        let losses = 0;
        for (const g of arr) {
            if (g.date >= date) break;
            if (g.wonByOpponent) wins += 1;
            else losses += 1;
        }
        result.set(recordKey(opponentId, date), { wins, losses });
    }

    return result;
}
