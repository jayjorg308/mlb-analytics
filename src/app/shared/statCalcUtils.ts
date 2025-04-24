export const getPitcherStats = (earnedRuns: number, walks: number, hits: number, inningsPitched: number) => {
    if (inningsPitched === 0) return { era: "-.--", whip: "-.--" };
    const wholeInnings = Math.floor(inningsPitched);
    const decimalInnings = parseFloat((inningsPitched - wholeInnings).toFixed(1)) * 3.3;
    const fixedInnings = wholeInnings + decimalInnings;
    const era = ((9 * earnedRuns) / fixedInnings).toFixed(2);
    const whip = ((walks + hits) / fixedInnings).toFixed(2);
    return { era, whip };
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTeamRank(
    stat: string,
    order: "asc" | "desc",
    teamId: number,
): Promise<{ teamId: number; statValue: number; rank: number } | null> {
    // Validate the column name to avoid SQL injection
    const validStats = [
        "strikeOuts",
        "runs",
        "hits",
        "walks",
        "earnedRuns",
        "inningsPitched",
        "homeRuns",
        "baseOnBalls",
        "hitByPitch",
        "saves",
        "shutouts", // Add any others you're using
    ];

    if (!validStats.includes(stat)) {
        throw new Error(`Invalid stat column: ${stat}`);
    }

    const result = await prisma.$queryRawUnsafe<{ teamId: number; statValue: number; rank: number }[]>(
        `
  SELECT * FROM (
    SELECT 
      "teamId",
      "${stat}" AS "statValue",
      RANK() OVER (ORDER BY "${stat}" ${order}) AS "rank"
    FROM "TeamSeasonPitchingStats"
  ) ranked
  WHERE "teamId" = $1
  `,
        teamId,
    );

    return result.length > 0 ? result[0] : null;
}
