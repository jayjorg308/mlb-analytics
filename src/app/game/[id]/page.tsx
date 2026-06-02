import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getGameDetail } from "./_data";
import FinalGameView from "./_components/FinalGameView";
import LiveGameView from "./_components/LiveGameView";

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ date?: string }>;
}) {
    const { id } = await params;
    const { date } = await searchParams;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    const detail = await getGameDetail(parsedId);
    if (!detail) return notFound();

    const backHref = date ? `/?date=${date}` : "/";

    return (
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", pt: 2, px: 2 }}>
                <IconButton component={Link} href={backHref} aria-label="Back to dashboard">
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
