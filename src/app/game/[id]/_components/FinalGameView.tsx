import { Box, Divider, Typography } from "@mui/material";
import BoxScoreTable from "./BoxScoreTable";
import { FinalStartingPitchers } from "./StartingPitchers";
import StartingLineups from "./StartingLineups";
import type { GameDetail } from "../_data";

export default function FinalGameView({ detail }: { detail: GameDetail }) {
    const { game, orderedHomePlayers, orderedAwayPlayers } = detail;
    const pitcherStatsMap = new Map(game.PlayerGamePitchingStats.map((s) => [s.playerId, s]));

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
            <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                {game.awayTeam.name} @ {game.homeTeam.name}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <BoxScoreTable
                innings={game.InningDetails}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                Starting Pitchers
            </Typography>
            <FinalStartingPitchers
                home={game.homeStartingPitcher}
                away={game.awayStartingPitcher}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                gameStats={pitcherStatsMap}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" align="center">
                Starting Lineup
            </Typography>
            <StartingLineups
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                home={orderedHomePlayers}
                away={orderedAwayPlayers}
                align="flex-start"
            />
        </Box>
    );
}
