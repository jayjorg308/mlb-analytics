import { NextRequest, NextResponse } from "next/server";
import { getPitcherDetail } from "@/app/shared/pitcherDetail";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const pitcherId = parseInt(id, 10);
        if (isNaN(pitcherId) || pitcherId <= 0) {
            return NextResponse.json({ error: "Invalid pitcher id" }, { status: 400 });
        }

        const detail = await getPitcherDetail(pitcherId);
        if (!detail) {
            return NextResponse.json({ error: "Pitcher not found" }, { status: 404 });
        }

        return NextResponse.json({
            pitcher: {
                id: detail.pitcher.id,
                firstName: detail.pitcher.firstName,
                lastName: detail.pitcher.lastName,
                teamId: detail.pitcher.teamId,
            },
            season: detail.season,
            starts: detail.starts,
        });
    } catch (err) {
        console.error("GET /api/pitcher/[id]/starts failed:", err);
        return NextResponse.json({ error: "Failed to fetch pitcher starts" }, { status: 500 });
    }
}
