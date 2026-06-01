import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
    Box,
    Typography,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import { PitcherDecision } from "@prisma/client";
import { getPitcherStats } from "@/app/shared/statCalcUtils";
import PitcherDialog from "@/app/components/PitcherDialog";

const DECISION_LABEL: Record<PitcherDecision, string> = {
    WIN: "W",
    LOSS: "L",
    SAVE: "SV",
    HOLD: "HLD",
    NO_DECISION: "ND",
};

const DECISION_COLOR: Record<PitcherDecision, "success" | "error" | "info" | "warning" | "default"> = {
    WIN: "success",
    LOSS: "error",
    SAVE: "info",
    HOLD: "warning",
    NO_DECISION: "default",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) return notFound();

    const seasonPitchingInclude = {
        PlayerSeasonPitchingStats: {
            select: {
                gamesPlayed: true,
                gamesStarted: true,
                wins: true,
                losses: true,
                earnedRuns: true,
                inningsPitched: true,
                baseOnBalls: true,
                hits: true,
                strikeOuts: true,
                runningPitcherScore: true,
            },
        },
    } as const;

    const game = await prisma.game.findUnique({
        where: { id: parsedId },
        include: {
            homeTeam: true,
            awayTeam: true,
            homeStartingPitcher: { include: seasonPitchingInclude },
            awayStartingPitcher: { include: seasonPitchingInclude },
            InningDetails: { orderBy: { inning: "asc" } },
            PlayerGamePitchingStats: {
                where: { gamesStarted: 1 },
                select: {
                    playerId: true,
                    summary: true,
                    decision: true,
                    pitchingScore: true,
                    inningsPitched: true,
                },
            },
        },
    });

    if (!game) return notFound();

    const { homeStartingPitcher: homePitcher, awayStartingPitcher: awayPitcher } = game;
    const { battingOrderHome: homeLineup, battingOrderAway: awayLineup } = game;

    const allLineupIds = [...(homeLineup || []), ...(awayLineup || [])];
    const players = allLineupIds.length ? await prisma.player.findMany({ where: { id: { in: allLineupIds } } }) : [];
    const playerMap = new Map(players.map((player) => [player.id, player]));
    const orderedHomePlayers = homeLineup?.map((id) => playerMap.get(id) || null) ?? [];
    const orderedAwayPlayers = awayLineup?.map((id) => playerMap.get(id) || null) ?? [];

    if (game.status === "FINAL") {
        const innings = game.InningDetails;
        const maxInning = innings.length > 0 ? Math.max(...innings.map((i) => i.inning)) : 9;
        const columnCount = Math.max(9, maxInning);
        const inningNumbers = Array.from({ length: columnCount }, (_, i) => i + 1);
        const inningByNumber = new Map(innings.map((i) => [i.inning, i]));

        const sumField = (field: "homeRuns" | "awayRuns" | "homeHits" | "awayHits" | "homeErrors" | "awayErrors") =>
            innings.reduce((acc, row) => acc + (row[field] ?? 0), 0);

        const awayR = sumField("awayRuns");
        const homeR = sumField("homeRuns");
        const awayH = sumField("awayHits");
        const homeH = sumField("homeHits");
        const awayE = sumField("awayErrors");
        const homeE = sumField("homeErrors");

        const lastInning = inningByNumber.get(maxInning);
        const homeDidNotBatLastInning =
            !!lastInning && lastInning.homeRuns === null && lastInning.awayRuns !== null;

        const pitcherStatsMap = new Map(game.PlayerGamePitchingStats.map((s) => [s.playerId, s]));

        const renderTeamRow = (
            side: "away" | "home",
            team: typeof game.awayTeam,
            totals: { r: number; h: number; e: number },
        ) => (
            <TableRow>
                <TableCell sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 130 }}>
                    <Image
                        src={team.logo_url.toLowerCase()}
                        alt={team.abbreviation}
                        width={28}
                        height={28}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {team.abbreviation}
                    </Typography>
                </TableCell>
                {inningNumbers.map((num) => {
                    const row = inningByNumber.get(num);
                    const value = side === "away" ? row?.awayRuns : row?.homeRuns;
                    const showX =
                        side === "home" && num === maxInning && homeDidNotBatLastInning && value == null;
                    return (
                        <TableCell key={num} align="center" sx={{ minWidth: 32, px: 1 }}>
                            {showX ? "X" : (value ?? 0)}
                        </TableCell>
                    );
                })}
                <TableCell align="center" sx={{ fontWeight: 700, borderLeft: "1px solid", borderColor: "divider" }}>
                    {totals.r}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {totals.h}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {totals.e}
                </TableCell>
            </TableRow>
        );

        const renderPitcherCard = (
            pitcher: typeof awayPitcher,
            label: string,
        ) => {
            if (!pitcher) {
                return (
                    <Box sx={{ width: "48%" }}>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="body2">TBD</Typography>
                    </Box>
                );
            }
            const stats = pitcherStatsMap.get(pitcher.id);
            return (
                <Box sx={{ width: "48%" }}>
                    <PitcherDialog
                        pitcher={{ id: pitcher.id, firstName: pitcher.firstName, lastName: pitcher.lastName }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
                            {pitcher.photoUrl && (
                                <Image
                                    src={pitcher.photoUrl}
                                    alt={pitcher.lastName}
                                    width={54}
                                    height={54}
                                    style={{ borderRadius: "50%" }}
                                />
                            )}
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {label}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {pitcher.firstName} {pitcher.lastName}
                                    </Typography>
                                    {stats?.decision && (
                                        <Chip
                                            label={DECISION_LABEL[stats.decision]}
                                            color={DECISION_COLOR[stats.decision]}
                                            size="small"
                                            sx={{ height: 18, fontSize: "0.7rem" }}
                                        />
                                    )}
                                </Box>
                                {stats?.summary && (
                                    <Typography variant="body2" color="text.secondary">
                                        {stats.summary}
                                    </Typography>
                                )}
                                {stats?.pitchingScore != null && (
                                    <Typography variant="caption" color="text.secondary">
                                        SCR: {stats.pitchingScore.toFixed(1)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </PitcherDialog>
                </Box>
            );
        };

        return (
            <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
                <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                    {game.awayTeam.name} @ {game.homeTeam.name}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                {inningNumbers.map((num) => (
                                    <TableCell key={num} align="center" sx={{ fontWeight: 600, px: 1 }}>
                                        {num}
                                    </TableCell>
                                ))}
                                <TableCell
                                    align="center"
                                    sx={{ fontWeight: 700, borderLeft: "1px solid", borderColor: "divider" }}
                                >
                                    R
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    H
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>
                                    E
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderTeamRow("away", game.awayTeam, { r: awayR, h: awayH, e: awayE })}
                            {renderTeamRow("home", game.homeTeam, { r: homeR, h: homeH, e: homeE })}
                        </TableBody>
                    </Table>
                </Paper>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                    Starting Pitchers
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    {renderPitcherCard(awayPitcher, game.awayTeam.abbreviation)}
                    {renderPitcherCard(homePitcher, game.homeTeam.abbreviation)}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" align="center">
                    Starting Lineup
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 2 }}>
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 2, gap: 2 }}>
                {[
                    { pitcher: awayPitcher, label: game.awayTeam.abbreviation },
                    { pitcher: homePitcher, label: game.homeTeam.abbreviation },
                ].map(({ pitcher, label }, idx) => {
                    if (!pitcher) {
                        return (
                            <Box key={idx} sx={{ width: "48%" }}>
                                <Typography variant="caption" color="text.secondary">
                                    {label}
                                </Typography>
                                <Typography variant="body2">TBD</Typography>
                            </Box>
                        );
                    }
                    const season = pitcher.PlayerSeasonPitchingStats[0];
                    const eraWhip = season
                        ? getPitcherStats(
                              season.earnedRuns,
                              season.baseOnBalls,
                              season.hits,
                              season.inningsPitched,
                          )
                        : null;
                    return (
                        <Box key={idx} sx={{ width: "48%" }}>
                            <PitcherDialog
                                pitcher={{
                                    id: pitcher.id,
                                    firstName: pitcher.firstName,
                                    lastName: pitcher.lastName,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1 }}>
                                    {pitcher.photoUrl && (
                                        <Image
                                            src={pitcher.photoUrl}
                                            alt={pitcher.lastName}
                                            width={64}
                                            height={64}
                                            style={{ borderRadius: "50%" }}
                                        />
                                    )}
                                    <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            {label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {pitcher.firstName} {pitcher.lastName}
                                        </Typography>
                                        {season ? (
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: "auto 1fr auto 1fr",
                                                    columnGap: 1.25,
                                                    rowGap: 0.25,
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary">
                                                    W-L
                                                </Typography>
                                                <Typography variant="caption">
                                                    {season.wins}-{season.losses}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    IP
                                                </Typography>
                                                <Typography variant="caption">
                                                    {season.inningsPitched.toFixed(1)}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary">
                                                    GS
                                                </Typography>
                                                <Typography variant="caption">{season.gamesStarted}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ERA
                                                </Typography>
                                                <Typography variant="caption">{eraWhip?.era ?? "-.--"}</Typography>

                                                <Typography variant="caption" color="text.secondary">
                                                    K
                                                </Typography>
                                                <Typography variant="caption">{season.strikeOuts}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    WHIP
                                                </Typography>
                                                <Typography variant="caption">{eraWhip?.whip ?? "-.--"}</Typography>

                                                <Typography variant="caption" color="text.secondary">
                                                    BB
                                                </Typography>
                                                <Typography variant="caption">{season.baseOnBalls}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    SCR
                                                </Typography>
                                                <Typography variant="caption">
                                                    {season.runningPitcherScore.toFixed(1)}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                No season stats yet
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </PitcherDialog>
                        </Box>
                    );
                })}
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
