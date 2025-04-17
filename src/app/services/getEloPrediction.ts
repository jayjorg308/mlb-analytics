type EloInput = {
    homeElo: number;
    awayElo: number;
    homePitcherAverageScore: number | null;
    homeTeamAveragePitchingScore: number | null;
    awayPitcherAverageScore: number | null;
    awayTeamAveragePitchingScore: number | null;
    isPlayoff?: boolean;
    isNeutral?: boolean;
    homeFieldAdvantage?: number;
};

type EloPredictionResult = {
    winProbHome: number;
    winProbAway: number;
};

export function getEloPrediction({
    homeElo,
    awayElo,
    homePitcherAverageScore,
    homeTeamAveragePitchingScore,
    awayPitcherAverageScore,
    awayTeamAveragePitchingScore,
    isPlayoff = false,
    isNeutral = false,
    homeFieldAdvantage = 24,
}: EloInput): EloPredictionResult {
    // Adjust for home field
    const hfa = isNeutral ? 0 : homeFieldAdvantage;

    // Adjust for pitcher performance
    const awayPitcherAdjustment =
        awayPitcherAverageScore && awayTeamAveragePitchingScore
            ? 4.7 * (awayPitcherAverageScore - awayTeamAveragePitchingScore)
            : 0;
    const homePitcherAdjustment =
        homePitcherAverageScore && homeTeamAveragePitchingScore
            ? 4.7 * (homePitcherAverageScore - homeTeamAveragePitchingScore)
            : 0;

    // console.log("away pitcher adjustment", awayElo, awayPitcherAdjustment, awayElo + awayPitcherAdjustment);
    // console.log("home pitcher adjustment", homeElo, homePitcherAdjustment, homeElo + homePitcherAdjustment + hfa);
    // console.log(
    //     "awayElo",
    //     awayElo,
    //     "awayPitcherAverageScore",
    //     awayPitcherAverageScore,
    //     "awayTeamAveragePitchingScore",
    //     awayTeamAveragePitchingScore,
    // );
    // console.log(
    //     "homeElo",
    //     homeElo,
    //     "homePitcherAverageScore",
    //     homePitcherAverageScore,
    //     "homeTeamAveragePitchingScore",
    //     homeTeamAveragePitchingScore,
    // );

    //const eloDiffNoPitch = homeElo + hfa - awayElo;
    let eloDiff = homeElo + homePitcherAdjustment + hfa - (awayElo + awayPitcherAdjustment);

    //console.log("eloDiffNoPitch", eloDiffNoPitch, "eloDiff", eloDiff);

    // Postseason multiplies eloDiff by 4/3
    if (isPlayoff) eloDiff *= 4 / 3;

    // Calculate win probability
    const homeTeamWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));

    return {
        winProbHome: homeTeamWinProb * 100,
        winProbAway: (1 - homeTeamWinProb) * 100,
    };
}
