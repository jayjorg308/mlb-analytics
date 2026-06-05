export const getPitcherStats = (earnedRuns: number, walks: number, hits: number, outs: number) => {
    if (outs === 0) return { era: "-.--", whip: "-.--" };
    const innings = outs / 3;
    const era = ((9 * earnedRuns) / innings).toFixed(2);
    const whip = ((walks + hits) / innings).toFixed(2);
    return { era, whip };
};

export const getBattingStats = (
    hits: number,
    atBats: number,
    walks: number,
    hitByPitch: number,
    sacFlies: number,
) => {
    if (atBats === 0) return { avg: ".---", obp: ".---" };
    const avg = (hits / atBats).toFixed(3).replace(/^0/, "");
    const obpDenom = atBats + walks + hitByPitch + sacFlies;
    const obp =
        obpDenom === 0
            ? ".---"
            : ((hits + walks + hitByPitch) / obpDenom).toFixed(3).replace(/^0/, "");
    return { avg, obp };
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
