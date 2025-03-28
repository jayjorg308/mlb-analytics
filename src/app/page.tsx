"use client";
import { useState, useEffect } from "react";
import { Box, Card, Typography, Divider, Grid } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import Image from "next/image";
import { Player, Team } from "@prisma/client";
//import Link from "next/link";

type Game = {
    id: number;
    date: string;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    homeStartingPitcher?: Player | null;
    awayStartingPitcher?: Player | null;
    battingOrderHome: number[];
    battingOrderAway: number[];
};

export default function Home() {
    const firstGameDate = dayjs("2025-03-18");
    const lastGameDate = dayjs("2025-09-28");
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [games, setGames] = useState<Game[]>([]);

    useEffect(() => {
        const fetchGames = async () => {
            const res = await fetch(`/api/games?date=${selectedDate.format("YYYY-MM-DD")}`);
            const data = await res.json();
            setGames(data);
        };

        fetchGames();
    }, [selectedDate]);

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, p: 2 }}>
            {/* Calendar Date Picker */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    minDate={firstGameDate}
                    maxDate={lastGameDate}
                />
            </Box>

            {/* Game Cards */}
            {games.length === 0 ? (
                <Typography align="center">No games found for this date.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {games.map((game) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={game.id}>
                            {/* <Link href={`/game/${game.id}`} passHref style={{ textDecoration: "none" }}> */}
                            <Card
                                sx={{
                                    p: 2,
                                    transition: "transform 0.2s ease-in-out",
                                    "&:hover": { transform: "scale(1.05)" },
                                    boxShadow: 3,
                                }}
                            >
                                {/* Game Time */}
                                <Typography variant="body2" align="center" sx={{ fontWeight: "bold", mb: 1 }}>
                                    {game.status === "FINAL"
                                        ? "Final"
                                        : new Date(game.date).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                          })}
                                </Typography>

                                <Divider />

                                {/* Teams & Scores */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        py: 2,
                                    }}
                                >
                                    {/* Away Team */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Image
                                            src={game.awayTeam.logo_url.toLowerCase()}
                                            alt={game.awayTeam.abbreviation}
                                            width={40}
                                            height={40}
                                        />
                                        <Typography variant="h6">{game.awayTeam.abbreviation}</Typography>
                                    </Box>
                                    <Typography variant="h6">{game.awayScore ?? "-"}</Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        py: 2,
                                    }}
                                >
                                    {/* Home Team */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Image
                                            src={game.homeTeam.logo_url.toLowerCase()}
                                            alt={game.homeTeam.abbreviation}
                                            width={40}
                                            height={40}
                                        />
                                        <Typography variant="h6">{game.homeTeam.abbreviation}</Typography>
                                    </Box>
                                    <Typography variant="h6">{game.homeScore ?? "-"}</Typography>
                                </Box>

                                <Divider />

                                {/* Pitcher Info */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mt: 2,
                                    }}
                                >
                                    {/* Away Pitcher */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {game.awayStartingPitcher?.photoUrl && (
                                            <Image
                                                src={game.awayStartingPitcher.photoUrl}
                                                alt={game.awayStartingPitcher.lastName}
                                                width={40}
                                                height={40}
                                                style={{ borderRadius: "50%" }}
                                            />
                                        )}
                                        <Typography variant="body2">
                                            {game.awayStartingPitcher
                                                ? `${game.awayStartingPitcher.firstName} ${game.awayStartingPitcher.lastName}`
                                                : "TBD"}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2">vs.</Typography>

                                    {/* Home Pitcher */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {game.homeStartingPitcher?.photoUrl && (
                                            <Image
                                                src={game.homeStartingPitcher.photoUrl}
                                                alt={game.homeStartingPitcher.lastName}
                                                width={40}
                                                height={40}
                                                style={{ borderRadius: "50%" }}
                                            />
                                        )}
                                        <Typography variant="body2">
                                            {game.homeStartingPitcher
                                                ? `${game.homeStartingPitcher.firstName} ${game.homeStartingPitcher.lastName}`
                                                : "TBD"}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Divider />
                                <Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" align="center" sx={{ fontWeight: "bold" }}>
                                            Batting Orders
                                        </Typography>
                                        <Typography variant="body2" align="left">
                                            Away: {game.battingOrderAway.length > 0 ? "Lineup Set" : "TBD"}
                                        </Typography>
                                        <Typography variant="body2" align="left">
                                            Home: {game.battingOrderHome.length > 0 ? "Lineup Set" : "TBD"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                            {/* </Link> */}
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
