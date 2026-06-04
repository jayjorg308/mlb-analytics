import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getPitcherDetail } from "./_data";
import PitcherHeader from "./_components/PitcherHeader";
import SeasonSummaryCard from "./_components/SeasonSummaryCard";
import GameLogTable from "./_components/GameLogTable";
import PitcherSeasonScoreChart, {
    type PitcherStartsResponse,
} from "@/app/components/PitcherSeasonScoreChart";

function resolveBack(from: string | undefined, gameId: string | undefined) {
    if (from === "stats") return { href: "/stats", label: "Back to stats" };
    if (from === "game" && gameId) return { href: `/game/${gameId}`, label: "Back to game" };
    if (from === "game") return { href: "/", label: "Back to dashboard" };
    return { href: "/", label: "Back to dashboard" };
}

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string; gameId?: string }>;
}) {
    const { id } = await params;
    const { from, gameId } = await searchParams;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    const detail = await getPitcherDetail(parsedId);
    if (!detail) return notFound();

    const back = resolveBack(from, gameId);

    const chartData: PitcherStartsResponse = {
        pitcher: {
            id: detail.pitcher.id,
            firstName: detail.pitcher.firstName,
            lastName: detail.pitcher.lastName,
            teamId: detail.pitcher.teamId,
        },
        season: detail.season,
        starts: detail.starts,
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
            <Box sx={{ mb: 1 }}>
                <IconButton component={Link} href={back.href} aria-label={back.label}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            <PitcherHeader pitcher={detail.pitcher} team={detail.team} />

            <SeasonSummaryCard season={detail.season} />

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Season Pitching Scores
                </Typography>
                <PitcherSeasonScoreChart
                    pitcherId={detail.pitcher.id}
                    initialData={chartData}
                    showSummary={false}
                />
            </Paper>

            <GameLogTable starts={detail.starts} pitcherId={detail.pitcher.id} />
        </Box>
    );
}
