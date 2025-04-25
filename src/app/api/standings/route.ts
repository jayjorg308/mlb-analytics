import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [teams] = await Promise.all([
            prisma.team.findMany({
                include: {
                    TeamRecord: {
                        where: { seasonId: 1 },
                    },
                    TeamELO: {
                        where: { seasonId: 1 },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            teams: teams.map((team) => {
                const teamRecord = team.TeamRecord[0];
                const teamELO = team.TeamELO[0];
                if (!teamRecord || !teamELO) {
                    return null;
                }
                return {
                    id: team.id,
                    name: `${team.city} ${team.name}`,
                    wins: teamRecord.wins,
                    losses: teamRecord.losses,
                    winPercentage:
                        teamRecord.wins + teamRecord.losses === 0
                            ? 0
                            : (teamRecord.wins / (teamRecord.wins + teamRecord.losses)).toFixed(3),
                    homeWins: teamRecord.homeWins,
                    homeLosses: teamRecord.homeLosses,
                    homeWinPercentage:
                        teamRecord.homeWins + teamRecord.homeLosses === 0
                            ? 0
                            : (teamRecord.homeWins / (teamRecord.homeWins + teamRecord.homeLosses)).toFixed(3),
                    awayWins: teamRecord.awayWins,
                    awayLosses: teamRecord.awayLosses,
                    awayWinPercentage:
                        teamRecord.awayWins + teamRecord.awayLosses === 0
                            ? 0
                            : (teamRecord.awayWins / (teamRecord.awayWins + teamRecord.awayLosses)).toFixed(3),
                    elo: teamELO.elo.toFixed(1),
                    eloChange: teamELO.eloChange.toFixed(1),
                };
            }),
        });
    } catch (error) {
        console.error("Error fetching standings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
