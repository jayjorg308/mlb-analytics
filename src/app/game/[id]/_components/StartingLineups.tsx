import { Box, Typography } from "@mui/material";
import type { GameWithRelations, LineupPlayer } from "../_data";

type Team = GameWithRelations["homeTeam"];

export default function StartingLineups({
    homeTeam,
    awayTeam,
    home,
    away,
    align = "flex-start",
}: {
    homeTeam: Team;
    awayTeam: Team;
    home: LineupPlayer[];
    away: LineupPlayer[];
    align?: "flex-start" | "center";
}) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: align, mt: 2 }}>
            {[
                { team: awayTeam, players: away },
                { team: homeTeam, players: home },
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
    );
}
