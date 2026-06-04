import { Box, Paper, Typography } from "@mui/material";
import type { PitcherSeasonSummary } from "@/app/components/PitcherSeasonScoreChart";

function StatTile({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <Box
            sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: highlight ? "primary.main" : "action.hover",
                color: highlight ? "primary.contrastText" : "text.primary",
                minWidth: 80,
                textAlign: "center",
            }}
        >
            <Typography variant="caption" sx={{ opacity: 0.85, display: "block", lineHeight: 1.1 }}>
                {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {value}
            </Typography>
        </Box>
    );
}

export default function SeasonSummaryCard({ season }: { season: PitcherSeasonSummary | null }) {
    if (!season) {
        return (
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    No season pitching stats recorded yet.
                </Typography>
            </Paper>
        );
    }
    const tiles: { label: string; value: string; highlight?: boolean }[] = [
        { label: "Avg Pitching Score", value: season.seasonAverageScore.toFixed(1), highlight: true },
        { label: "W-L", value: `${season.wins}-${season.losses}` },
        { label: "ERA", value: season.era },
        { label: "WHIP", value: season.whip },
        { label: "GS", value: `${season.gamesStarted}` },
        { label: "IP", value: season.inningsPitched.toFixed(1) },
        { label: "K", value: `${season.strikeOuts}` },
        { label: "BB", value: `${season.baseOnBalls}` },
        { label: "H", value: `${season.hits}` },
        { label: "ER", value: `${season.earnedRuns}` },
        { label: "HR", value: `${season.homeRuns}` },
    ];
    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Season Averages
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {tiles.map((t) => (
                    <StatTile key={t.label} label={t.label} value={t.value} highlight={t.highlight} />
                ))}
            </Box>
        </Paper>
    );
}
