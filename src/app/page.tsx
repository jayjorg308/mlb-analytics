"use client";
import { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import Image from "next/image";

type Game = {
    id: number;
    date: string;
    homeTeam: { abbreviation: string; logo_url: string };
    awayTeam: { abbreviation: string; logo_url: string };
    homeScore: number | null;
    awayScore: number | null;
    status: string;
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
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
            {/* Calendar Date Picker */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <DatePicker
                    value={selectedDate}
                    onChange={(date) => date && setSelectedDate(date)}
                    minDate={firstGameDate}
                    maxDate={lastGameDate}
                />
            </Box>

            {/* Games List */}
            {games.length === 0 ? (
                <Typography align="center">No games found for this date.</Typography>
            ) : (
                games.map((game) => (
                    <Card key={game.id} sx={{ mb: 2 }}>
                        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Image
                                    src={game.awayTeam.logo_url.toLowerCase()}
                                    alt={game.awayTeam.abbreviation}
                                    width={40}
                                    height={40}
                                />
                                <Typography variant="h6" sx={{ mx: 1 }}>
                                    {game.awayTeam.abbreviation}
                                </Typography>
                            </Box>
                            <Typography variant="h6">{game.awayScore ?? "-"}</Typography>

                            <Typography variant="h6">@</Typography>

                            <Typography variant="h6">{game.homeScore ?? "-"}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography variant="h6" sx={{ mx: 1 }}>
                                    {game.homeTeam.abbreviation}
                                </Typography>
                                <Image
                                    src={game.homeTeam.logo_url.toLowerCase()}
                                    alt={game.homeTeam.abbreviation}
                                    width={40}
                                    height={40}
                                />
                            </Box>
                        </CardContent>
                        <Typography align="center" sx={{ pb: 1 }}>
                            {game.status === "FINAL"
                                ? "Final"
                                : new Date(game.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                    </Card>
                ))
            )}
        </Box>
    );
}
