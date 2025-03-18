import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const mlbLeague = await prisma.league.findFirst({
        where: { abbreviation: "MLB" },
        include: { teams: true },
    });

    return NextResponse.json(mlbLeague?.teams || []);
}
