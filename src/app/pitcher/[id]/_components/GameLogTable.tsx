"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { PitcherStart } from "@/app/components/PitcherSeasonScoreChart";
import { DECISION_COLOR, DECISION_LABEL } from "@/app/shared/pitcherDecisionLabels";

type Row = PitcherStart & { id: number };

function buildColumns(pitcherId: number): GridColDef<Row>[] {
    return [
    {
        field: "date",
        headerName: "Date",
        width: 130,
        renderCell: (params) => {
            const d = new Date(params.row.date);
            const label = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            return (
                <Link
                    href={`/game/${params.row.gameId}?from=pitcher&pitcherId=${pitcherId}`}
                    style={{ color: "inherit", textDecoration: "underline" }}
                >
                    {label}
                </Link>
            );
        },
    },
    {
        field: "opponent",
        headerName: "Opponent",
        width: 140,
        renderCell: (params) => (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                <Typography variant="body2">
                    {params.row.isHome ? "vs " : "@ "}
                    {params.row.opponent.abbreviation}
                </Typography>
            </Box>
        ),
        sortComparator: (_a, _b, paramA, paramB) => {
            const a = (paramA.value as PitcherStart["opponent"])?.abbreviation ?? "";
            const b = (paramB.value as PitcherStart["opponent"])?.abbreviation ?? "";
            return a.localeCompare(b);
        },
    },
    {
        field: "opponentRecordEntering",
        headerName: "Opp Rec",
        width: 130,
        sortable: true,
        valueGetter: (_value, row) => {
            const rec = row.opponentRecordEntering;
            const total = rec.wins + rec.losses;
            return total === 0 ? -1 : rec.wins / total;
        },
        renderCell: (params) => {
            const rec = params.row.opponentRecordEntering;
            const total = rec.wins + rec.losses;
            if (total === 0) {
                return (
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                        <Typography variant="body2" color="text.secondary">
                            —
                        </Typography>
                    </Box>
                );
            }
            const pct = (rec.wins / total).toFixed(3).replace(/^0/, "");
            return (
                <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <Typography variant="body2">
                        {rec.wins}-{rec.losses}{" "}
                        <Typography component="span" variant="body2" color="text.secondary">
                            ({pct})
                        </Typography>
                    </Typography>
                </Box>
            );
        },
    },
    {
        field: "decision",
        headerName: "Decision",
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                }}
            >
                {params.row.decision ? (
                    <Chip
                        label={DECISION_LABEL[params.row.decision]}
                        color={DECISION_COLOR[params.row.decision]}
                        size="small"
                        sx={{ height: 22, fontSize: "0.75rem" }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                )}
            </Box>
        ),
    },
    {
        field: "inningsPitched",
        headerName: "IP",
        width: 70,
        type: "number",
        headerAlign: "left",
        align: "left",
        valueFormatter: (value: number) => value?.toFixed(1) ?? "0.0",
    },
    { field: "hits", headerName: "H", width: 60, type: "number", headerAlign: "left", align: "left" },
    { field: "runs", headerName: "R", width: 60, type: "number", headerAlign: "left", align: "left" },
    {
        field: "baseOnBalls",
        headerName: "BB",
        width: 60,
        type: "number",
        headerAlign: "left",
        align: "left",
    },
    { field: "strikeOuts", headerName: "K", width: 60, type: "number", headerAlign: "left", align: "left" },
    { field: "homeRuns", headerName: "HR", width: 60, type: "number", headerAlign: "left", align: "left" },
    {
        field: "pitchingScore",
        headerName: "Pitching Score",
        width: 140,
        type: "number",
        headerAlign: "left",
        align: "left",
        valueFormatter: (value: number) => value?.toFixed(1) ?? "—",
    },
    ];
}

export default function GameLogTable({ starts, pitcherId }: { starts: PitcherStart[]; pitcherId: number }) {
    const rows: Row[] = starts.map((s) => ({ ...s, id: s.gameId }));
    const columns = useMemo(() => buildColumns(pitcherId), [pitcherId]);
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Game Log
            </Typography>
            {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No starts recorded for this pitcher yet.
                </Typography>
            ) : (
                <Box>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        initialState={{
                            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        pageSizeOptions={[10, 25, 50, { value: -1, label: "All" }]}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        disableColumnFilter
                        disableColumnResize
                        autoHeight
                    />
                </Box>
            )}
        </Paper>
    );
}
