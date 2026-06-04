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

    const starts: PitcherStart[] = startsRaw.map((s, idx) => {
        const isHome = player.teamId != null && s.game.homeTeamId === player.teamId;
        const opponentTeam = isHome ? s.game.awayTeam : s.game.homeTeam;
        return {
            gameId: s.gameId,
            date: s.game.date.toISOString(),
            startNumber: idx + 1,
            pitchingScore: s.pitchingScore as number,
            decision: s.decision,
            inningsPitched: s.inningsPitched,
            strikeOuts: s.strikeOuts,
            baseOnBalls: s.baseOnBalls,
            hits: s.hits,
            runs: s.runs,
            homeRuns: s.homeRuns,
            opponent: {
                id: opponentTeam.id,
                name: opponentTeam.name,
                abbreviation: opponentTeam.abbreviation,
                logoUrl: opponentTeam.logo_url,
            },
            isHome,
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
