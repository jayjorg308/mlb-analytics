type EloInput = {
    homeElo: number;
    awayElo: number;
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
    isPlayoff = false,
    isNeutral = false,
    homeFieldAdvantage = 24,
}: EloInput): EloPredictionResult {
    // Adjust for home field
    const hfa = isNeutral ? 0 : homeFieldAdvantage;
    let eloDiff = homeElo + hfa - awayElo;

    // Postseason multiplies eloDiff by 4/3
    if (isPlayoff) eloDiff *= 4 / 3;

    // Calculate win probability
    const homeTeamWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));

    return {
        winProbHome: homeTeamWinProb * 100,
        winProbAway: (1 - homeTeamWinProb) * 100,
    };
}
