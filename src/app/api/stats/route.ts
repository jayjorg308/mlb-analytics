import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPitcherStats } from "@/app/shared/statCalcUtils";

export async function GET() {
    try {
        const [pitchersSeasons, pitcherScores, teams] = await Promise.all([
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
            prisma.playerGamePitchingStats.findMany({
                where: {
                    gamesStarted: 1,
                    pitchingScore: { not: null },
                },
                include: {
                    player: {
                        include: {
                            team: true,
                        },
                    },
                    game: true,
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

        const highestScore = Math.max(...pitcherScores.map((p) => p.pitchingScore ?? 0));
        const highestScorePitcherGame = pitcherScores.find((p) => p.pitchingScore === highestScore);
        const lowestScore = Math.min(...pitcherScores.map((p) => p.pitchingScore ?? 0));
        const lowestScorePitcherGame = pitcherScores.find((p) => p.pitchingScore === lowestScore);
        const averageScore = pitcherScores.reduce((acc, p) => acc + (p.pitchingScore ?? 0), 0) / pitcherScores.length;

        return NextResponse.json({
            pitchers: pitchersSeasons.map((pitcherSeason) => {
                const { era, whip } = getPitcherStats(
                    pitcherSeason.earnedRuns || 0,
                    pitcherSeason.baseOnBalls || 0,
                    pitcherSeason.hits || 0,
                    pitcherSeason.outs || 0,
                );
                return {
                    id: pitcherSeason.playerId,
                    name: `${pitcherSeason.player.firstName} ${pitcherSeason.player.lastName}`,
                    team: pitcherSeason.player.team?.abbreviation || "",
                    wins: pitcherSeason.wins || 0,
                    losses: pitcherSeason.losses || 0,
                    era: era,
                    gamesStarted: pitcherSeason.gamesStarted || 0,
                    inningsPitched: pitcherSeason.inningsPitched.toFixed(1) || 0,
                    hits: pitcherSeason.hits || 0,
                    runs: pitcherSeason.runs || 0,
                    earnedRuns: pitcherSeason.earnedRuns || 0,
                    hrsAllowed: pitcherSeason.homeRuns || 0,
                    battersFaced: pitcherSeason.battersFaced || 0,
                    whip: whip,
                    strikeouts: pitcherSeason.strikeOuts || 0,
                    walks: pitcherSeason.baseOnBalls || 0,
                    score: pitcherSeason.runningPitcherScore.toFixed(2),
                };
            }),
            pitchingScoreStats: {
                highestScore: highestScore.toFixed(2),
                highestScorePitcher: highestScorePitcherGame
                    ? `${highestScorePitcherGame.player.firstName} ${highestScorePitcherGame.player.lastName} (${highestScorePitcherGame.player.team?.abbreviation})`
                    : "",
                highestScoreGameDate: highestScorePitcherGame?.game.date.toLocaleDateString() || "",
                highestScoreGameId: highestScorePitcherGame?.gameId || "",
                lowestScore: lowestScore.toFixed(2),
                lowestScorePitcher: lowestScorePitcherGame
                    ? `${lowestScorePitcherGame.player.firstName} ${lowestScorePitcherGame.player.lastName} (${lowestScorePitcherGame.player.team?.abbreviation})`
                    : "",
                lowestScoreGameDate: lowestScorePitcherGame?.game.date.toLocaleDateString() || "",
                lowestScoreGameId: lowestScorePitcherGame?.gameId || "",
                averageScore: averageScore.toFixed(2),
                totalPitchingScores: pitcherScores.length,
            } as { highestScore: string; lowestScore: string; averageScore: string; totalPitchingScores: number },
            teams: teams.map((team) => {
                const { era, whip } = getPitcherStats(
                    team.earnedRuns || 0,
                    team.baseOnBalls || 0,
                    team.hits || 0,
                    team.outs || 0,
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
