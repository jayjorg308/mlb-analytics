"use client";

import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useState, useEffect } from "react";

interface PitcherStats {
    id: number;
    name: string;
    team: string;
    wins: number;
    losses: number;
    era: number;
    gamesStarted: number;
    inningsPitched: number;
    hits: number;
    runs: number;
    earnedRuns: number;
    hrsAllowed: number;
    strikeouts: number;
    walks: number;
    battersFaced: number;
    whip: number;
    score: number;
}

interface TeamStats {
    id: number;
    name: string;
    gamesPlayed: number;
    inningsPitched: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    score: number;
}

const pitcherColumns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "team", headerName: "Team", width: 100 },
    { field: "wins", headerName: "W", width: 80 },
    { field: "losses", headerName: "L", width: 80 },
    {
        field: "era",
        headerName: "ERA",
        width: 80,
        type: "number",
    },
    { field: "gamesStarted", headerName: "GS", width: 80 },
    { field: "inningsPitched", headerName: "IP", width: 80, type: "number" },
    { field: "hits", headerName: "H", width: 80 },
    { field: "runs", headerName: "R", width: 80 },
    { field: "earnedRuns", headerName: "ER", width: 80 },
    { field: "hrsAllowed", headerName: "HR", width: 80 },
    { field: "walks", headerName: "BB", width: 80 },
    { field: "strikeouts", headerName: "SO", width: 80 },
    { field: "battersFaced", headerName: "BF", width: 80 },
    { field: "whip", headerName: "WHIP", width: 80, type: "number" },
    { field: "score", headerName: "Average Pitching Score", width: 225, type: "number" },
];

const teamColumns: GridColDef[] = [
    { field: "name", headerName: "Team", flex: 1 },
    { field: "era", headerName: "ERA", width: 80, type: "number" },
    { field: "gamesPlayed", headerName: "GP", width: 80 },
    { field: "hits", headerName: "H", width: 80 },
    { field: "runs", headerName: "R", width: 80 },
    { field: "earnedRuns", headerName: "ER", width: 80 },
    { field: "hrsAllowed", headerName: "HR", width: 80 },
    { field: "walks", headerName: "BB", width: 80 },
    { field: "strikeouts", headerName: "SO", width: 80 },
    { field: "battersFaced", headerName: "BF", width: 80 },
    { field: "whip", headerName: "WHIP", width: 80, type: "number" },
    {
        field: "score",
        headerName: "Team Average Pitching Score",
        width: 250,
        type: "number",
    },
];

export default function StatsPage() {
    const [tabValue, setTabValue] = useState(0);
    const [pitcherStats, setPitcherStats] = useState<PitcherStats[]>([]);
    const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/stats");
                const data = await response.json();
                setPitcherStats(data.pitchers || []);
                setTeamStats(data.teams || []);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Stats
            </Typography>

            <Paper sx={{ width: "100%", mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tab label="Pitchers" />
                    <Tab label="Teams" />
                </Tabs>

                {tabValue === 0 && (
                    <DataGrid
                        rows={pitcherStats}
                        columns={pitcherColumns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 10 },
                            },
                            sorting: {
                                sortModel: [{ field: "score", sort: "desc" }],
                            },
                        }}
                        pageSizeOptions={[10, 50, 100]}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        disableColumnFilter
                        disableColumnResize
                        loading={loading}
                        autoHeight
                    />
                )}

                {tabValue === 1 && (
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
                        loading={loading}
                        autoHeight
                    />
                )}
            </Paper>
        </Box>
    );
}
