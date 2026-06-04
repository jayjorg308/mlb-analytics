import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getGameDetail } from "./_data";
import FinalGameView from "./_components/FinalGameView";
import LiveGameView from "./_components/LiveGameView";

function resolveBack(
    date: string | undefined,
    from: string | undefined,
    pitcherId: string | undefined,
) {
    if (from === "pitcher" && pitcherId) {
        return { href: `/pitcher/${pitcherId}`, label: "Back to pitcher" };
    }
    return { href: date ? `/?date=${date}` : "/", label: "Back to dashboard" };
}

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ date?: string; from?: string; pitcherId?: string }>;
}) {
    const { id } = await params;
    const { date, from, pitcherId } = await searchParams;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    const detail = await getGameDetail(parsedId);
    if (!detail) return notFound();

    const back = resolveBack(date, from, pitcherId);

    return (
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", pt: 2, px: 2 }}>
                <IconButton component={Link} href={back.href} aria-label={back.label}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>
            {detail.game.status === "FINAL" ? (
                <FinalGameView detail={detail} />
            ) : (
                <LiveGameView detail={detail} />
            )}
        </>
    );
}
