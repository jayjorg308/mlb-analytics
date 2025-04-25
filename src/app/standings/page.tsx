"use client";

import { Box, Paper } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useState, useEffect } from "react";

interface TeamStats {
    id: number;
    name: string;
    wins: number;
    losses: number;
    winPercentage: number;
    homeWins: number;
    homeLosses: number;
    homeWinPercentage: number;
    awayWins: number;
    awayLosses: number;
    awayWinPercentage: number;
    elo: number;
    eloChange: number;
}

const teamColumns: GridColDef[] = [
    { field: "name", headerName: "Team", flex: 1, minWidth: 200 },
    { field: "wins", headerName: "W", width: 80 },

    { field: "losses", headerName: "L", width: 80 },
    {
        field: "winPercentage",
        headerName: "Win %",
        width: 100,
        type: "number",
        headerAlign: "left",
        align: "left",
    },
    { field: "homeWins", headerName: "HW", width: 80 },
    { field: "homeLosses", headerName: "HL", width: 80 },
    {
        field: "homeWinPercentage",
        headerName: "Home Win %",
        width: 120,
        type: "number",
        headerAlign: "left",
        align: "left",
    },
    { field: "awayWins", headerName: "AW", width: 80 },
    { field: "awayLosses", headerName: "AL", width: 80 },
    {
        field: "awayWinPercentage",
        headerName: "Away Win %",
        width: 120,
        type: "number",
        headerAlign: "left",
        align: "left",
    },
    { field: "elo", headerName: "ELO", width: 100, type: "number", headerAlign: "left", align: "left" },
    { field: "eloChange", headerName: "ELO Change", width: 120, type: "number", headerAlign: "left", align: "left" },
];

export default function StandingsPage() {
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/standings");
                const data = await response.json();
                setTeamStats(data.teams || []);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ width: "100%", mb: 2 }}>
                <DataGrid
                    rows={teamStats}
                    columns={teamColumns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 },
                        },
                        sorting: {
                            sortModel: [{ field: "score", sort: "desc" }],
                        },
                    }}
                    pageSizeOptions={[10, 15, 30]}
                    disableRowSelectionOnClick
                    disableColumnMenu
                    disableColumnFilter
                    disableColumnResize
                    showToolbar
                    loading={loading}
                    autoHeight
                />
            </Paper>
        </Box>
    );
}
