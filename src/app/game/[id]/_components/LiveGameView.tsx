import Image from "next/image";
import { Box, Divider, Typography } from "@mui/material";
import { LiveStartingPitchers } from "./StartingPitchers";
import StartingLineups from "./StartingLineups";
import type { GameDetail } from "../_data";

export default function LiveGameView({ detail }: { detail: GameDetail }) {
    const { game, orderedHomePlayers, orderedAwayPlayers } = detail;

    return (
        <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
            <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                {game.awayTeam.name} @ {game.homeTeam.name}
            </Typography>

            <Divider sx={{ my: 2 }} />

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

            <Typography variant="h6" align="center">
                Starting Pitchers
            </Typography>
            <LiveStartingPitchers
                home={game.homeStartingPitcher}
                away={game.awayStartingPitcher}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                gameId={game.id}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" align="center">
                Starting Lineup
            </Typography>
            <StartingLineups
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                home={orderedHomePlayers}
                away={orderedAwayPlayers}
                align="center"
            />
        </Box>
    );
}
