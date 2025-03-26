import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
        return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
    }

    const games = await prisma.game.findMany({
        include: {
            homeTeam: { select: { abbreviation: true, logo_url: true } },
            awayTeam: { select: { abbreviation: true, logo_url: true } },
        },
        orderBy: { date: "asc" },
        take: 5,
    });

    console.log(games);

    return NextResponse.json(games);
}
