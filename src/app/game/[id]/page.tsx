import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Box, Typography, Divider } from "@mui/material";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    // Fetch game & related data in a single query
    const game = await prisma.game.findUnique({
        where: { id: parsedId },
        include: {
            homeTeam: true,
            awayTeam: true,
            homeStartingPitcher: true,
            awayStartingPitcher: true,
        },
    });

    if (!game) return notFound();

    const { homeStartingPitcher: homePitcher, awayStartingPitcher: awayPitcher } = game;
    const { battingOrderHome: homeLineup, battingOrderAway: awayLineup } = game;

    // const homeRank = await getTeamRank("hits", "asc", game.homeTeam.id);
    // const awayRank = await getTeamRank("hits", "asc", game.awayTeam.id);

    // Combine both home & away lineup ids to fetch all players in one query
    const allLineupIds = [...(homeLineup || []), ...(awayLineup || [])];

    const players = allLineupIds.length ? await prisma.player.findMany({ where: { id: { in: allLineupIds } } }) : [];

    // Convert the array into a dictionary for quick lookups
    const playerMap = new Map(players.map((player) => [player.id, player]));

    // Reorder players according to the original lineup order
    const orderedHomePlayers = homeLineup?.map((id) => playerMap.get(id) || null) ?? [];
    const orderedAwayPlayers = awayLineup?.map((id) => playerMap.get(id) || null) ?? [];

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
            <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                {game.awayTeam.name} @ {game.homeTeam.name}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Team Scores */}
            {[
                { team: game.awayTeam, score: game.awayScore },
                { team: game.homeTeam, score: game.homeScore },
            ].map(({ team, score }) => (
                <Box
                    key={team.id}
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Image src={team.logo_url} alt={team.name} width={60} height={60} />
                        <Typography variant="h6">{team.name}</Typography>
                    </Box>
                    <Typography variant="h6">{score ?? "-"}</Typography>
                </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Starting Pitchers */}
            <Typography variant="h6" align="center">
                Starting Pitchers
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                {[awayPitcher, homePitcher].map((pitcher, idx) => (
                    <Typography key={idx} variant="body2">
                        {pitcher ? `${pitcher.uniformNumber} ${pitcher.firstName} ${pitcher.lastName}` : "TBD"}
                    </Typography>
                ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Starting Lineups */}
            <Typography variant="h6" align="center">
                Starting Lineup
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                {[
                    { team: game.awayTeam, players: orderedAwayPlayers },
                    { team: game.homeTeam, players: orderedHomePlayers },
                ].map(({ team, players }) => (
                    <Box key={team.id} sx={{ width: "45%" }}>
                        <Typography variant="subtitle1" align="center">
                            {team.name} Lineup
                        </Typography>
                        {players.length > 0 ? (
                            players.map(
                                (player, index) =>
                                    player && (
                                        <Typography key={index} variant="body2">
                                            {player.uniformNumber} {player.firstName} {player.lastName} (
                                            {player.position})
                                        </Typography>
                                    ),
                            )
                        ) : (
                            <Typography variant="body2">No lineup available</Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
