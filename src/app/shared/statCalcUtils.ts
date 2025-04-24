export const getPitcherStats = (earnedRuns: number, walks: number, hits: number, inningsPitched: number) => {
    if (inningsPitched === 0) return { era: "-.--", whip: "-.--" };
    const wholeInnings = Math.floor(inningsPitched);
    const decimalInnings = parseFloat((inningsPitched - wholeInnings).toFixed(1)) * 3.3;
    const fixedInnings = wholeInnings + decimalInnings;
    const era = ((9 * earnedRuns) / fixedInnings).toFixed(2);
    const whip = ((walks + hits) / fixedInnings).toFixed(2);
    return { era, whip };
};
