import { Fragment, ReactNode } from "react";
import Image from "next/image";
import { Box, Chip, Typography } from "@mui/material";
import PitcherDialog from "@/app/components/PitcherDialog";
import { getPitcherStats } from "@/app/shared/statCalcUtils";
import { DECISION_COLOR, DECISION_LABEL } from "@/app/shared/pitcherDecisionLabels";
import type { GamePitcher, GamePitcherStats, GameWithRelations } from "../_data";

type Team = GameWithRelations["homeTeam"];

function PitcherCardShell({
    pitcher,
    label,
    photoSize,
    gap,
    infoFlex,
    children,
}: {
    pitcher: GamePitcher | null;
    label: string;
    photoSize: number;
    gap: number;
    infoFlex?: number;
    children: ReactNode;
}) {
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
    const infoSx = infoFlex !== undefined ? { flex: infoFlex } : undefined;
    return (
        <Box sx={{ width: "48%" }}>
            <PitcherDialog
                pitcher={{ id: pitcher.id, firstName: pitcher.firstName, lastName: pitcher.lastName }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap, p: 1 }}>
                    {pitcher.photoUrl && (
                        <Image
                            src={pitcher.photoUrl}
                            alt={pitcher.lastName}
                            width={photoSize}
                            height={photoSize}
                            style={{ borderRadius: "50%" }}
                        />
                    )}
                    <Box sx={infoSx}>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                        {children}
                    </Box>
                </Box>
            </PitcherDialog>
        </Box>
    );
}

function FinalStatsBody({ pitcher, stats }: { pitcher: GamePitcher; stats: GamePitcherStats | undefined }) {
    if (!pitcher) return null;
    return (
        <>
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
        </>
    );
}

function LiveStatsBody({ pitcher }: { pitcher: NonNullable<GamePitcher> }) {
    const season = pitcher.PlayerSeasonPitchingStats[0];
    const eraWhip = season
        ? getPitcherStats(season.earnedRuns, season.baseOnBalls, season.hits, season.inningsPitched)
        : null;

    return (
        <>
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
                    {(
                        [
                            ["W-L", `${season.wins}-${season.losses}`],
                            ["IP", season.inningsPitched.toFixed(1)],
                            ["GS", `${season.gamesStarted}`],
                            ["ERA", eraWhip?.era ?? "-.--"],
                            ["K", `${season.strikeOuts}`],
                            ["WHIP", eraWhip?.whip ?? "-.--"],
                            ["BB", `${season.baseOnBalls}`],
                            ["SCR", season.runningPitcherScore.toFixed(1)],
                        ] as const
                    ).map(([statLabel, value]) => (
                        <Fragment key={statLabel}>
                            <Typography variant="caption" color="text.secondary">
                                {statLabel}
                            </Typography>
                            <Typography variant="caption">{value}</Typography>
                        </Fragment>
                    ))}
                </Box>
            ) : (
                <Typography variant="caption" color="text.secondary">
                    No season stats yet
                </Typography>
            )}
        </>
    );
}

export function FinalStartingPitchers({
    home,
    away,
    homeTeam,
    awayTeam,
    gameStats,
}: {
    home: GamePitcher | null;
    away: GamePitcher | null;
    homeTeam: Team;
    awayTeam: Team;
    gameStats: Map<number, GamePitcherStats>;
}) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <PitcherCardShell pitcher={away} label={awayTeam.abbreviation} photoSize={54} gap={1}>
                {away && <FinalStatsBody pitcher={away} stats={gameStats.get(away.id)} />}
            </PitcherCardShell>
            <PitcherCardShell pitcher={home} label={homeTeam.abbreviation} photoSize={54} gap={1}>
                {home && <FinalStatsBody pitcher={home} stats={gameStats.get(home.id)} />}
            </PitcherCardShell>
        </Box>
    );
}

export function LiveStartingPitchers({
    home,
    away,
    homeTeam,
    awayTeam,
}: {
    home: GamePitcher | null;
    away: GamePitcher | null;
    homeTeam: Team;
    awayTeam: Team;
}) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mt: 2,
                gap: 2,
            }}
        >
            <PitcherCardShell pitcher={away} label={awayTeam.abbreviation} photoSize={64} gap={2} infoFlex={1}>
                {away && <LiveStatsBody pitcher={away} />}
            </PitcherCardShell>
            <PitcherCardShell pitcher={home} label={homeTeam.abbreviation} photoSize={64} gap={2} infoFlex={1}>
                {home && <LiveStatsBody pitcher={home} />}
            </PitcherCardShell>
        </Box>
    );
}
