import { Box, Divider, Typography } from "@mui/material";
import { getBattingStats } from "@/app/shared/statCalcUtils";
import type { GameBatterStats, GameWithRelations, LineupPlayer } from "../_data";

type Team = GameWithRelations["homeTeam"];
type SubBatter = GameWithRelations["PlayerGameBattingStats"][number];

const STAT_COL_WIDTH = 36;

function StatHeader({ labels }: { labels: readonly string[] }) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: `1fr repeat(${labels.length}, ${STAT_COL_WIDTH}px)`,
                columnGap: 0.75,
                px: 0.5,
                mt: 1,
            }}
        >
            <span />
            {labels.map((label) => (
                <Typography
                    key={label}
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: "right" }}
                >
                    {label}
                </Typography>
            ))}
        </Box>
    );
}

function BatterRow({
    index,
    uniformNumber,
    firstName,
    lastName,
    position,
    values,
}: {
    index?: number;
    uniformNumber: number | null;
    firstName: string;
    lastName: string;
    position: string;
    values: readonly (string | number)[];
}) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: `1fr repeat(${values.length}, ${STAT_COL_WIDTH}px)`,
                columnGap: 0.75,
                alignItems: "center",
                px: 0.5,
                py: 0.25,
            }}
        >
            <Typography variant="body2" noWrap>
                {index !== undefined ? `${index}. ` : ""}
                {uniformNumber != null ? `#${uniformNumber} ` : ""}
                {firstName} {lastName} ({position})
            </Typography>
            {values.map((v, i) => (
                <Typography key={i} variant="body2" sx={{ textAlign: "right" }}>
                    {v}
                </Typography>
            ))}
        </Box>
    );
}

function liveValuesFor(player: NonNullable<LineupPlayer>): readonly (string | number)[] {
    const season = player.PlayerSeasonBattingStats[0];
    if (!season) return ["-", "-", "-", "-"];
    const { avg, obp } = getBattingStats(
        season.hits,
        season.atBats,
        season.baseOnBalls,
        season.hitByPitch,
        season.sacFlies,
    );
    return [avg, obp, season.homeRuns, season.rbi];
}

function finalValuesFor(stats: GameBatterStats | undefined): readonly (string | number)[] {
    if (!stats) return ["-", "-", "-", "-"];
    return [`${stats.hits}-${stats.atBats}`, stats.homeRuns, stats.strikeOuts, stats.rbi];
}

export function LiveStartingLineups({
    homeTeam,
    awayTeam,
    home,
    away,
}: {
    homeTeam: Team;
    awayTeam: Team;
    home: LineupPlayer[];
    away: LineupPlayer[];
}) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 2 }}>
            {[
                { team: awayTeam, players: away },
                { team: homeTeam, players: home },
            ].map(({ team, players }) => (
                <Box key={team.id} sx={{ width: "48%" }}>
                    <Typography variant="subtitle1" align="center">
                        {team.name} Lineup
                    </Typography>
                    {players.length > 0 ? (
                        <>
                            <StatHeader labels={["AVG", "OBP", "HR", "RBI"]} />
                            {players.map(
                                (player, index) =>
                                    player && (
                                        <BatterRow
                                            key={player.id}
                                            index={index + 1}
                                            uniformNumber={player.uniformNumber}
                                            firstName={player.firstName}
                                            lastName={player.lastName}
                                            position={player.position}
                                            values={liveValuesFor(player)}
                                        />
                                    ),
                            )}
                        </>
                    ) : (
                        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                            No lineup available
                        </Typography>
                    )}
                </Box>
            ))}
        </Box>
    );
}

export function FinalLineups({
    homeTeam,
    awayTeam,
    home,
    away,
    homeSubs,
    awaySubs,
    gameStats,
}: {
    homeTeam: Team;
    awayTeam: Team;
    home: LineupPlayer[];
    away: LineupPlayer[];
    homeSubs: SubBatter[];
    awaySubs: SubBatter[];
    gameStats: Map<number, GameBatterStats>;
}) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 2 }}>
            {[
                { team: awayTeam, players: away, subs: awaySubs },
                { team: homeTeam, players: home, subs: homeSubs },
            ].map(({ team, players, subs }) => (
                <Box key={team.id} sx={{ width: "48%" }}>
                    <Typography variant="subtitle1" align="center">
                        {team.name} Lineup
                    </Typography>
                    {players.length > 0 ? (
                        <>
                            <StatHeader labels={["H-AB", "HR", "K", "RBI"]} />
                            {players.map(
                                (player, index) =>
                                    player && (
                                        <BatterRow
                                            key={player.id}
                                            index={index + 1}
                                            uniformNumber={player.uniformNumber}
                                            firstName={player.firstName}
                                            lastName={player.lastName}
                                            position={player.position}
                                            values={finalValuesFor(gameStats.get(player.id))}
                                        />
                                    ),
                            )}
                        </>
                    ) : (
                        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                            No lineup available
                        </Typography>
                    )}
                    {subs.length > 0 && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                                Substitutes / Pinch Hitters
                            </Typography>
                            {subs.map((sub) => (
                                <BatterRow
                                    key={sub.playerId}
                                    uniformNumber={sub.player.uniformNumber}
                                    firstName={sub.player.firstName}
                                    lastName={sub.player.lastName}
                                    position={sub.player.position}
                                    values={finalValuesFor(sub)}
                                />
                            ))}
                        </>
                    )}
                </Box>
            ))}
        </Box>
    );
}
