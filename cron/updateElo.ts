type EloInput = {
    homeElo: number;
    awayElo: number;
    homeScore: number;
    awayScore: number;
    isPlayoff?: boolean;
    isNeutral?: boolean;
    homeFieldAdvantage?: number;
    baseMargin?: number; // Optional override, default is 3.4
};

type EloResult = {
    newHomeElo: number;
    newAwayElo: number;
    eloChange: number;
    winProbHome: number;
};

export function updateElo({
    homeElo,
    awayElo,
    homeScore,
    awayScore,
    isPlayoff = false,
    isNeutral = false,
    homeFieldAdvantage = 24,
    baseMargin = 3.4,
}: EloInput): EloResult {
    // Adjust for home field
    const hfa = isNeutral ? 0 : homeFieldAdvantage;
    let eloDiff = homeElo + hfa - awayElo;

    // Postseason multiplies eloDiff by 4/3
    if (isPlayoff) eloDiff *= 4 / 3;

    // Calculate win probability
    const winProbHome = 1 / (1 + Math.pow(10, -eloDiff / 400));

    // Game outcome: 1 if home win, 0 if loss
    const outcome = homeScore > awayScore ? 1 : 0;

    // Margin of victory
    const rawMargin = Math.abs(homeScore - awayScore);

    // Adjusted actual margin (flattened)
    const marginAdj = Math.pow(rawMargin + 1, 0.7) * 1.41;

    // Expected margin based on Elo difference
    const expectedMargin =
        Math.pow(eloDiff, 3) * 5.46554876e-8 +
        Math.pow(eloDiff, 2) * 8.96073139e-6 +
        eloDiff * 2.44895265e-3 +
        baseMargin;

    // K-factor: 6 for playoffs, otherwise 4
    const k = isPlayoff ? 6 : 4;

    // Elo change
    const eloChange = k * (outcome - winProbHome) * (marginAdj / expectedMargin);

    return {
        newHomeElo: homeElo + eloChange,
        newAwayElo: awayElo - eloChange,
        eloChange,
        winProbHome,
    };
}
