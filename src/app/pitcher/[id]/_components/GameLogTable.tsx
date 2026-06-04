"use client";

import Link from "next/link";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type { PitcherStart } from "@/app/components/PitcherSeasonScoreChart";
import { DECISION_COLOR, DECISION_LABEL } from "@/app/shared/pitcherDecisionLabels";

type Row = PitcherStart & { id: number };

const columns: GridColDef<Row>[] = [
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
            const dateParam = d.toISOString().slice(0, 10);
            return (
                <Link
                    href={`/game/${params.row.gameId}?date=${dateParam}`}
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
        field: "decision",
        headerName: "Decision",
        width: 110,
        renderCell: (params) =>
            params.row.decision ? (
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

export default function GameLogTable({ starts }: { starts: PitcherStart[] }) {
    const rows: Row[] = starts.map((s) => ({ ...s, id: s.gameId }));
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
