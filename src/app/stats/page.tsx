"use client";

import { Box, Paper, Tabs, Tab } from "@mui/material";
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
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    { field: "team", headerName: "Team", width: 100 },
    { field: "wins", headerName: "W", width: 80 },
    { field: "losses", headerName: "L", width: 80 },
    {
        field: "era",
        headerName: "ERA",
        width: 80,
        type: "number",
        align: "left",
        headerAlign: "left",
    },
    { field: "gamesStarted", headerName: "GS", width: 80 },
    { field: "inningsPitched", headerName: "IP", width: 80, type: "number", headerAlign: "left", align: "left" },
    { field: "hits", headerName: "H", width: 80 },
    { field: "runs", headerName: "R", width: 80 },
    { field: "earnedRuns", headerName: "ER", width: 80 },
    { field: "hrsAllowed", headerName: "HR", width: 80 },
    { field: "walks", headerName: "BB", width: 80 },
    { field: "strikeouts", headerName: "SO", width: 80 },
    { field: "battersFaced", headerName: "BF", width: 80 },
    { field: "whip", headerName: "WHIP", width: 80, type: "number", headerAlign: "left", align: "left" },
    {
        field: "score",
        headerName: "Average Pitching Score",
        width: 225,
        type: "number",
        headerAlign: "left",
        align: "left",
    },
];

const teamColumns: GridColDef[] = [
    { field: "name", headerName: "Team", flex: 1, minWidth: 200 },
    { field: "era", headerName: "ERA", width: 80, type: "number", headerAlign: "left", align: "left" },
    { field: "gamesPlayed", headerName: "GP", width: 80 },
    { field: "hits", headerName: "H", width: 80 },
    { field: "runs", headerName: "R", width: 80 },
    { field: "earnedRuns", headerName: "ER", width: 80 },
    { field: "hrsAllowed", headerName: "HR", width: 80 },
    { field: "walks", headerName: "BB", width: 80 },
    { field: "strikeouts", headerName: "SO", width: 80 },
    { field: "battersFaced", headerName: "BF", width: 80 },
    { field: "whip", headerName: "WHIP", width: 80, type: "number", headerAlign: "left", align: "left" },
    {
        field: "score",
        headerName: "Team Average Pitching Score",
        width: 250,
        type: "number",
        headerAlign: "left",
        align: "left",
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
            <Paper sx={{ width: "100%", mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tab sx={{ textTransform: "none" }} label="Starting Pitchers" />
                    <Tab sx={{ textTransform: "none" }} label="Team Pitching" />
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
                        pageSizeOptions={[10, 50, 100, { value: -1, label: "All" }]}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        disableColumnFilter
                        disableColumnResize
                        showToolbar
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
                        showToolbar
                        loading={loading}
                        autoHeight
                    />
                )}
            </Paper>
        </Box>
    );
}
