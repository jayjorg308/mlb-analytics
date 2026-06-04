"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Chip, CircularProgress, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { PitcherDecision } from "@prisma/client";
import { DECISION_COLOR, DECISION_LABEL } from "@/app/shared/pitcherDecisionLabels";

type Opponent = {
    id: number;
    name: string;
    abbreviation: string;
    logoUrl: string;
};

export type PitcherStart = {
    gameId: number;
    date: string;
    startNumber: number;
    pitchingScore: number;
    decision: PitcherDecision | null;
    inningsPitched: number;
    strikeOuts: number;
    baseOnBalls: number;
    hits: number;
    runs: number;
    homeRuns: number;
    opponent: Opponent;
    isHome: boolean;
    opponentRecordEntering: { wins: number; losses: number };
};

export type PitcherSeasonSummary = {
    seasonAverageScore: number;
    wins: number;
    losses: number;
    gamesStarted: number;
    inningsPitched: number;
    strikeOuts: number;
    baseOnBalls: number;
    hits: number;
    earnedRuns: number;
    homeRuns: number;
    era: string;
    whip: string;
};

export type PitcherStartsResponse = {
    pitcher: { id: number; firstName: string; lastName: string; teamId: number | null };
    season: PitcherSeasonSummary | null;
    starts: PitcherStart[];
};

type Bucket = { label: string; color: string };

const BUCKET_COLORS = {
    poor: "#d32f2f",
    mediocre: "#f57c00",
    good: "#388e3c",
    exceptional: "#1b5e20",
} as const;

function bucketFor(score: number): Bucket {
    if (score < 40) return { label: "Poor", color: BUCKET_COLORS.poor };
    if (score < 55) return { label: "Mediocre", color: BUCKET_COLORS.mediocre };
    if (score < 70) return { label: "Good", color: BUCKET_COLORS.good };
    return { label: "Exceptional", color: BUCKET_COLORS.exceptional };
}

const NO_RECORD_COLOR = "#9e9e9e";

type OpponentEncoding = "winning" | "losing" | "none";

function opponentEncodingFor(rec: { wins: number; losses: number }): OpponentEncoding {
    const total = rec.wins + rec.losses;
    if (total === 0) return "none";
    // Exact .500 is treated as a winning record (>= .500) to avoid an ambiguous third state.
    return rec.wins / total >= 0.5 ? "winning" : "losing";
}

function formatWinPct(rec: { wins: number; losses: number }): string {
    const total = rec.wins + rec.losses;
    if (total === 0) return "";
    const pct = rec.wins / total;
    return pct.toFixed(3).replace(/^0/, "");
}

const CHART_HEIGHT = 380;
const MARGIN = { top: 20, right: 64, bottom: 40, left: 44 };

export default function PitcherSeasonScoreChart({
    pitcherId,
    initialData,
    showSummary = true,
}: {
    pitcherId: number;
    initialData?: PitcherStartsResponse;
    showSummary?: boolean;
}) {
    const [data, setData] = useState<PitcherStartsResponse | null>(initialData ?? null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(!initialData);

    useEffect(() => {
        if (initialData) {
            setData(initialData);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`/api/pitcher/${pitcherId}/starts`)
            .then(async (res) => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return (await res.json()) as PitcherStartsResponse;
            })
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [pitcherId, initialData]);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return (
            <Typography color="error" sx={{ py: 4, textAlign: "center" }}>
                Could not load pitcher data: {error}
            </Typography>
        );
    }
    if (!data || data.starts.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No starts recorded for this pitcher yet.
            </Typography>
        );
    }

    return <ChartView data={data} showSummary={showSummary} />;
}

function ChartView({ data, showSummary }: { data: PitcherStartsResponse; showSummary: boolean }) {
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(720);
    const [hover, setHover] = useState<{ start: PitcherStart; x: number; y: number } | null>(null);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setWidth(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { starts, season } = data;

    const { x, y, linePath, rollingPath, innerW, innerH } = useMemo(() => {
        const innerW = Math.max(200, width - MARGIN.left - MARGIN.right);
        const innerH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

        const dates = starts.map((s) => new Date(s.date));
        const scores = starts.map((s) => s.pitchingScore);

        const xDomain = d3.extent(dates) as [Date, Date];
        const x = d3.scaleTime().domain(xDomain).range([0, innerW]).nice();

        const dataMin = d3.min(scores) ?? 0;
        const dataMax = d3.max(scores) ?? 100;
        const yMin = Math.min(0, dataMin - 5);
        const yMax = Math.max(100, dataMax + 5);
        const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]).nice();

        const line = d3
            .line<PitcherStart>()
            .x((d) => x(new Date(d.date)))
            .y((d) => y(d.pitchingScore));
        const linePath = line(starts) ?? "";

        let rollingPath = "";
        if (starts.length >= 2) {
            const rolling = starts.map((s, i) => {
                const window = starts.slice(Math.max(0, i - 4), i + 1);
                const avg = d3.mean(window, (w) => w.pitchingScore) ?? 0;
                return { date: new Date(s.date), avg };
            });
            const rLine = d3
                .line<{ date: Date; avg: number }>()
                .x((d) => x(d.date))
                .y((d) => y(d.avg));
            rollingPath = rLine(rolling) ?? "";
        }

        return { x, y, linePath, rollingPath, innerW, innerH };
    }, [starts, width]);

    const xTicks = x.ticks(Math.min(8, Math.max(3, Math.floor(innerW / 100))));
    const yTicks = y.ticks(6);
    const yMin = y.domain()[0];

    const bandRect = (lo: number, hi: number, color: string) => {
        const top = y(hi);
        const bottom = y(lo);
        return <rect x={0} y={top} width={innerW} height={bottom - top} fill={color} fillOpacity={0.07} />;
    };

    return (
        <Box>
            {showSummary && <SummaryHeader data={data} />}

            <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
                <svg width={width} height={CHART_HEIGHT} role="img" aria-label="Pitcher season score chart">
                    <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                        {bandRect(yMin, 40, BUCKET_COLORS.poor)}
                        {bandRect(40, 55, BUCKET_COLORS.mediocre)}
                        {bandRect(55, 70, BUCKET_COLORS.good)}
                        {bandRect(70, y.domain()[1], BUCKET_COLORS.exceptional)}

                        {yTicks.map((t) => (
                            <g key={t} transform={`translate(0,${y(t)})`}>
                                <line x1={0} x2={innerW} stroke={theme.palette.divider} strokeDasharray="2,3" />
                                <text
                                    x={-8}
                                    dy="0.32em"
                                    textAnchor="end"
                                    fontSize={11}
                                    fill={theme.palette.text.secondary}
                                >
                                    {t}
                                </text>
                            </g>
                        ))}

                        <g transform={`translate(0,${innerH})`}>
                            <line x1={0} x2={innerW} stroke={theme.palette.text.secondary} />
                            {xTicks.map((t, i) => (
                                <g key={i} transform={`translate(${x(t)},0)`}>
                                    <line y1={0} y2={5} stroke={theme.palette.text.secondary} />
                                    <text y={20} textAnchor="middle" fontSize={11} fill={theme.palette.text.secondary}>
                                        {d3.timeFormat("%b %d")(t)}
                                    </text>
                                </g>
                            ))}
                        </g>

                        {season && season.seasonAverageScore > 0 && (
                            <g>
                                <line
                                    x1={0}
                                    x2={innerW}
                                    y1={y(season.seasonAverageScore)}
                                    y2={y(season.seasonAverageScore)}
                                    stroke={theme.palette.primary.main}
                                    strokeWidth={2}
                                />
                                <text
                                    x={innerW + 4}
                                    y={y(season.seasonAverageScore)}
                                    dy="0.32em"
                                    fontSize={11}
                                    fill={theme.palette.primary.main}
                                >
                                    AVG {season.seasonAverageScore.toFixed(1)}
                                </text>
                            </g>
                        )}

                        {rollingPath && (
                            <path
                                d={rollingPath}
                                stroke={theme.palette.secondary.main}
                                strokeWidth={2}
                                strokeDasharray="5,4"
                                fill="none"
                            />
                        )}

                        <path
                            d={linePath}
                            stroke={theme.palette.text.secondary}
                            strokeOpacity={0.5}
                            strokeWidth={1.5}
                            fill="none"
                        />

                        {starts.map((s) => {
                            const cx = x(new Date(s.date));
                            const cy = y(s.pitchingScore);
                            const encoding = opponentEncodingFor(s.opponentRecordEntering);
                            const bucketColor = bucketFor(s.pitchingScore).color;
                            const hoverHandlers = {
                                onMouseEnter: () =>
                                    setHover({ start: s, x: cx + MARGIN.left, y: cy + MARGIN.top }),
                                onMouseLeave: () => setHover(null),
                            };
                            if (encoding === "none") {
                                // Season's first game (opponent had no prior games): neutral dot — no opponent context to encode.
                                return (
                                    <circle
                                        key={s.gameId}
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill={NO_RECORD_COLOR}
                                        stroke="none"
                                        style={{ cursor: "pointer" }}
                                        {...hoverHandlers}
                                    />
                                );
                            }
                            // Winning opponent (>=.500): filled. Losing opponent (<.500): hollow with bucket-colored ring.
                            const filled = encoding === "winning";
                            return (
                                <circle
                                    key={s.gameId}
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill={filled ? bucketColor : theme.palette.background.paper}
                                    stroke={bucketColor}
                                    strokeWidth={2}
                                    style={{ cursor: "pointer" }}
                                    {...hoverHandlers}
                                />
                            );
                        })}
                    </g>
                </svg>

                {hover && (
                    <Tooltip
                        start={hover.start}
                        x={hover.x}
                        y={hover.y}
                        containerWidth={width}
                        totalStarts={starts.length}
                    />
                )}
            </Box>

            <Legend
                hasRolling={starts.length >= 2}
                hasAverage={!!season && season.seasonAverageScore > 0}
                hasNoRecord={starts.some(
                    (s) => opponentEncodingFor(s.opponentRecordEntering) === "none",
                )}
            />
        </Box>
    );
}

function SummaryHeader({ data }: { data: PitcherStartsResponse }) {
    const { season, pitcher } = data;
    if (!season) {
        return (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Season aggregates unavailable for {pitcher.firstName} {pitcher.lastName}.
            </Typography>
        );
    }
    const stats: [string, string][] = [
        ["W-L", `${season.wins}-${season.losses}`],
        ["GS", `${season.gamesStarted}`],
        ["IP", season.inningsPitched.toFixed(1)],
        ["ERA", season.era],
        ["WHIP", season.whip],
        ["K", `${season.strikeOuts}`],
        ["BB", `${season.baseOnBalls}`],
        ["SCR", season.seasonAverageScore.toFixed(1)],
    ];
    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                rowGap: 0.5,
                mb: 1.5,
                px: 0.5,
            }}
        >
            {stats.map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", gap: 0.5, alignItems: "baseline" }}>
                    <Typography variant="caption" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

function Tooltip({
    start,
    x,
    y,
    containerWidth,
    totalStarts,
}: {
    start: PitcherStart;
    x: number;
    y: number;
    containerWidth: number;
    totalStarts: number;
}) {
    const TOOLTIP_WIDTH = 240;
    const TOOLTIP_HEIGHT_ESTIMATE = 170;
    const flipLeft = x + TOOLTIP_WIDTH + 16 > containerWidth;
    const left = flipLeft ? x - TOOLTIP_WIDTH - 12 : x + 12;
    const maxTop = Math.max(0, CHART_HEIGHT - TOOLTIP_HEIGHT_ESTIMATE);
    const top = Math.min(maxTop, Math.max(0, y - 20));
    const bucket = bucketFor(start.pitchingScore);
    const dateLabel = d3.timeFormat("%b %-d, %Y")(new Date(start.date));
    const statRows: [string, string][] = [
        ["IP", start.inningsPitched.toFixed(1)],
        ["K", `${start.strikeOuts}`],
        ["BB", `${start.baseOnBalls}`],
        ["H", `${start.hits}`],
        ["R", `${start.runs}`],
        ["HR", `${start.homeRuns}`],
    ];
    return (
        <Box
            sx={{
                position: "absolute",
                left,
                top,
                width: TOOLTIP_WIDTH,
                pointerEvents: "none",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: 3,
                p: 1.25,
                zIndex: 10,
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                    {dateLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Start {start.startNumber} of {totalStarts}
                </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Image src={start.opponent.logoUrl} alt={start.opponent.abbreviation} width={22} height={22} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {start.isHome ? "vs" : "@"} {start.opponent.abbreviation}
                </Typography>
                {start.decision && (
                    <Chip
                        label={DECISION_LABEL[start.decision]}
                        color={DECISION_COLOR[start.decision]}
                        size="small"
                        sx={{ height: 18, fontSize: "0.7rem", ml: "auto" }}
                    />
                )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                    OPP REC
                </Typography>
                {(() => {
                    const rec = start.opponentRecordEntering;
                    const total = rec.wins + rec.losses;
                    if (total === 0) {
                        return (
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                —
                            </Typography>
                        );
                    }
                    return (
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {rec.wins}-{rec.losses} ({formatWinPct(rec)})
                        </Typography>
                    );
                })()}
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    columnGap: 1,
                    rowGap: 0.25,
                    mt: 0.5,
                }}
            >
                {statRows.map(([label, value]) => (
                    <Box key={label} sx={{ display: "flex", gap: 0.5, alignItems: "baseline" }}>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {value}
                        </Typography>
                    </Box>
                ))}
            </Box>
            <Box
                sx={{
                    mt: 0.75,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid",
                    borderColor: "divider",
                    pt: 0.5,
                }}
            >
                <Typography variant="caption" sx={{ color: bucket.color, fontWeight: 600 }}>
                    {bucket.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    SCR {start.pitchingScore.toFixed(1)}
                </Typography>
            </Box>
        </Box>
    );
}

function Legend({
    hasRolling,
    hasAverage,
    hasNoRecord,
}: {
    hasRolling: boolean;
    hasAverage: boolean;
    hasNoRecord: boolean;
}) {
    const theme = useTheme();
    const swatches: { color: string; label: string }[] = [
        { color: BUCKET_COLORS.poor, label: "Poor (<40)" },
        { color: BUCKET_COLORS.mediocre, label: "Mediocre (40-54)" },
        { color: BUCKET_COLORS.good, label: "Good (55-69)" },
        { color: BUCKET_COLORS.exceptional, label: "Exceptional (70+)" },
    ];
    return (
        <Box sx={{ mt: 1, px: 0.5 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {swatches.map((s) => (
                    <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: s.color, borderRadius: "50%" }} />
                        <Typography variant="caption" color="text.secondary">
                            {s.label}
                        </Typography>
                    </Box>
                ))}
                {hasAverage && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 2, bgcolor: theme.palette.primary.main }} />
                        <Typography variant="caption" color="text.secondary">
                            Season avg
                        </Typography>
                    </Box>
                )}
                {hasRolling && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                            sx={{
                                width: 16,
                                height: 2,
                                background: `repeating-linear-gradient(to right, ${theme.palette.secondary.main} 0 5px, transparent 5px 9px)`,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            5-game rolling avg
                        </Typography>
                    </Box>
                )}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 0.75 }}>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                    Opp record entering game:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            boxSizing: "border-box",
                            borderRadius: "50%",
                            bgcolor: theme.palette.text.primary,
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                        Winning record (≥.500)
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            boxSizing: "border-box",
                            borderRadius: "50%",
                            border: `2px solid ${theme.palette.text.primary}`,
                            bgcolor: "transparent",
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                        Losing record (&lt;.500)
                    </Typography>
                </Box>
                {hasNoRecord && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                boxSizing: "border-box",
                                borderRadius: "50%",
                                bgcolor: NO_RECORD_COLOR,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                            No record yet (season opener)
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
