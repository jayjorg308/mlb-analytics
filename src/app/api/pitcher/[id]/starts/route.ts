import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPitcherStats } from "@/app/shared/statCalcUtils";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const pitcherId = parseInt(id, 10);
        if (isNaN(pitcherId) || pitcherId <= 0) {
            return NextResponse.json({ error: "Invalid pitcher id" }, { status: 400 });
        }

        const player = await prisma.player.findUnique({
            where: { id: pitcherId },
            select: { id: true, firstName: true, lastName: true, teamId: true },
        });

        if (!player) {
            return NextResponse.json({ error: "Pitcher not found" }, { status: 404 });
        }

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

        const starts = startsRaw.map((s, idx) => {
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

        const season = seasonStats
            ? (() => {
                  const { era, whip } = getPitcherStats(
                      seasonStats.earnedRuns,
                      seasonStats.baseOnBalls,
                      seasonStats.hits,
                      seasonStats.inningsPitched,
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

        return NextResponse.json({
            pitcher: {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                teamId: player.teamId,
            },
            season,
            starts,
        });
    } catch (err) {
        console.error("GET /api/pitcher/[id]/starts failed:", err);
        return NextResponse.json({ error: "Failed to fetch pitcher starts" }, { status: 500 });
    }
}
