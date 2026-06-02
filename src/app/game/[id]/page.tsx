import { notFound } from "next/navigation";
import { getGameDetail } from "./_data";
import FinalGameView from "./_components/FinalGameView";
import LiveGameView from "./_components/LiveGameView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    const detail = await getGameDetail(parsedId);
    if (!detail) return notFound();

    return detail.game.status === "FINAL" ? (
        <FinalGameView detail={detail} />
    ) : (
        <LiveGameView detail={detail} />
    );
}
