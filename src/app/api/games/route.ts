import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date"); // Expecting "YYYY-MM-DD"

        if (!dateStr) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        // Convert the date string to the correct timezone (assuming UTC storage)
        const startOfDay = dayjs.tz(dateStr, "America/Denver").startOf("day").utc().toDate();
        const endOfDay = dayjs.tz(dateStr, "America/Denver").endOf("day").add(6, "hours").utc().toDate();
        // Adds 6 extra hours to include late-night games

        // First, get the current season based on the date
        const currentSeason = await prisma.season.findFirst({
            where: {
                startDate: {
                    lte: startOfDay,
                },
                endDate: {
                    gte: startOfDay,
                },
            },
        });

        if (!currentSeason) {
            return NextResponse.json({ error: "No active season found for the given date" }, { status: 404 });
        }

        const games = await prisma.game.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                homeTeam: {
                    include: {
                        TeamRecord: {
                            where: {
                                seasonId: currentSeason.id,
                            },
                        },
                        TeamELO: {
                            where: {
                                seasonId: currentSeason.id,
                            },
                        },
                    },
                },
                awayTeam: {
                    include: {
                        TeamRecord: {
                            where: {
                                seasonId: currentSeason.id,
                            },
                        },
                        TeamELO: {
                            where: {
                                seasonId: currentSeason.id,
                            },
                        },
                    },
                },
                // Join the Player table for starting pitchers
                homeStartingPitcher: true, // Alias for home pitcher
                awayStartingPitcher: true, // Alias for away pitcher
            },
            orderBy: {
                date: "asc",
            },
        });

        return NextResponse.json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
