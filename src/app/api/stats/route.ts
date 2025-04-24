import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPitcherStats } from "@/app/shared/statCalcUtils";

export async function GET() {
    try {
        const [pitchers, teams] = await Promise.all([
            prisma.playerSeasonPitchingStats.findMany({
                where: {
                    seasonId: 1,
                    gamesStarted: {
                        gt: 0,
                    },
                },
                include: {
                    player: {
                        include: {
                            team: true,
                        },
                    },
                },
            }),
            prisma.teamSeasonPitchingStats.findMany({
                where: {
                    seasonId: 1,
                },
                include: {
                    team: true,
                },
            }),
        ]);

        return NextResponse.json({
            pitchers: pitchers.map((pitcher) => {
                const { era, whip } = getPitcherStats(
                    pitcher.earnedRuns || 0,
                    pitcher.baseOnBalls || 0,
                    pitcher.hits || 0,
                    pitcher.inningsPitched || 0,
                );
                return {
                    id: pitcher.playerId,
                    name: `${pitcher.player.firstName} ${pitcher.player.lastName}`,
                    team: pitcher.player.team?.abbreviation || "",
                    wins: pitcher.wins || 0,
                    losses: pitcher.losses || 0,
                    era: era,
                    gamesStarted: pitcher.gamesStarted || 0,
                    inningsPitched: pitcher.inningsPitched.toFixed(1) || 0,
                    hits: pitcher.hits || 0,
                    runs: pitcher.runs || 0,
                    earnedRuns: pitcher.earnedRuns || 0,
                    hrsAllowed: pitcher.homeRuns || 0,
                    battersFaced: pitcher.battersFaced || 0,
                    whip: whip,
                    strikeouts: pitcher.strikeOuts || 0,
                    walks: pitcher.baseOnBalls || 0,
                    score: pitcher.runningPitcherScore.toFixed(2),
                };
            }),
            teams: teams.map((team) => {
                const { era, whip } = getPitcherStats(
                    team.earnedRuns || 0,
                    team.baseOnBalls || 0,
                    team.hits || 0,
                    team.inningsPitched || 0,
                );
                return {
                    id: team.teamId,
                    name: `${team.team.city} ${team.team.name}`,
                    era: era,
                    gamesPlayed: team.gamesPlayed || 0,
                    hits: team.hits || 0,
                    runs: team.runs || 0,
                    earnedRuns: team.earnedRuns || 0,
                    hrsAllowed: team.homeRuns || 0,
                    strikeouts: team.strikeOuts || 0,
                    walks: team.baseOnBalls || 0,
                    battersFaced: team.battersFaced || 0,
                    whip: whip,
                    score: team.teamPitchingScore?.toFixed(2) || 0,
                };
            }),
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
