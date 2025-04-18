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

type EloPredictionExport = {
    awayPitcherAdjustment: number;
    awayWinProbNoPitcherAdjustment: number;
    awayWinProbWithPitcherAdjustment: number;
    homePitcherAdjustment: number;
    homeWinProbNoPitcherAdjustment: number;
    homeWinProbWithPitcherAdjustment: number;
    eloDiffNoPitcherAdjustment: number;
    eloDiffWithPitcherAdjustment: number;
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

    let eloDiff = homeElo + homePitcherAdjustment + hfa - (awayElo + awayPitcherAdjustment);

    // Postseason multiplies eloDiff by 4/3
    if (isPlayoff) eloDiff *= 4 / 3;

    // Calculate win probability
    const homeTeamWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));

    return {
        winProbHome: homeTeamWinProb * 100,
        winProbAway: (1 - homeTeamWinProb) * 100,
    };
}

export function getPredictionForExport({
    homeElo,
    awayElo,
    homePitcherAverageScore,
    homeTeamAveragePitchingScore,
    awayPitcherAverageScore,
    awayTeamAveragePitchingScore,
    isPlayoff = false,
    isNeutral = false,
    homeFieldAdvantage = 24,
}: EloInput): EloPredictionExport {
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

    let eloDiffNoPitch = homeElo + hfa - awayElo;
    let eloDiffPitching = homeElo + homePitcherAdjustment + hfa - (awayElo + awayPitcherAdjustment);

    // Postseason multiplies eloDiff by 4/3
    if (isPlayoff) {
        eloDiffNoPitch *= 4 / 3;
        eloDiffPitching *= 4 / 3;
    }

    // Calculate win probability
    const homeTeamWinProbNoPitch = 1 / (1 + Math.pow(10, -eloDiffNoPitch / 400));
    const homeTeamWinProb = 1 / (1 + Math.pow(10, -eloDiffPitching / 400));

    return {
        awayPitcherAdjustment: awayPitcherAdjustment,
        awayWinProbNoPitcherAdjustment: 1 - homeTeamWinProbNoPitch,
        awayWinProbWithPitcherAdjustment: 1 - homeTeamWinProb,
        homePitcherAdjustment: homePitcherAdjustment,
        homeWinProbNoPitcherAdjustment: homeTeamWinProbNoPitch,
        homeWinProbWithPitcherAdjustment: homeTeamWinProb,
        eloDiffNoPitcherAdjustment: eloDiffNoPitch,
        eloDiffWithPitcherAdjustment: eloDiffPitching,
    };
}
