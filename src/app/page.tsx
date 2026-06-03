"use client";
import { Suspense, useState, useEffect } from "react";
import { Box, Card, Typography, Divider, Grid, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Image from "next/image";
import { Player, Team } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getEloPrediction, getPredictionForExport } from "./services/getEloPrediction";
import { getPitcherStats } from "./shared/statCalcUtils";
import BettingCardDialog from "./components/BettingCardDialog";

dayjs.extend(customParseFormat);

const SHOW_EXPORT_AND_CARD = false;

type Game = {
    id: number;
    date: string;
    homeTeam: Team & {
        TeamRecord: Array<{
            wins: number;
            losses: number;
            homeWins: number;
            homeLosses: number;
            awayWins: number;
            awayLosses: number;
        }>;
        TeamELO: Array<{
            elo: number;
            eloChange: number;
        }>;
        TeamSeasonPitchingStats: Array<{
            teamPitchingScore: number | null;
        }>;
    };
    awayTeam: Team & {
        TeamRecord: Array<{
            wins: number;
            losses: number;
            homeWins: number;
            homeLosses: number;
            awayWins: number;
            awayLosses: number;
        }>;
        TeamELO: Array<{
            elo: number;
            eloChange: number;
        }>;
        TeamSeasonPitchingStats: Array<{
            teamPitchingScore: number | null;
        }>;
    };
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    homeStartingPitcher:
        | (Player & {
              PlayerSeasonPitchingStats: Array<{
                  gamesPlayed: number;
                  gamesStarted: number;
                  wins: number;
                  losses: number;
                  earnedRuns: number;
                  inningsPitched: number;
                  outs: number;
                  baseOnBalls: number;
                  hits: number;
                  runningPitcherScore: number;
              }>;
          })
        | null;
    awayStartingPitcher:
        | (Player & {
              PlayerSeasonPitchingStats: Array<{
                  gamesPlayed: number;
                  gamesStarted: number;
                  wins: number;
                  losses: number;
                  earnedRuns: number;
                  inningsPitched: number;
                  outs: number;
                  baseOnBalls: number;
                  hits: number;
                  runningPitcherScore: number;
              }>;
          })
        | null;
    battingOrderHome: number[];
    battingOrderAway: number[];
    InningDetails: Array<{ inning: number }>;
};

export default function Home() {
    return (
        <Suspense fallback={null}>
            <Dashboard />
        </Suspense>
    );
}

function Dashboard() {
    const firstGameDate = dayjs("2026-03-25");
    const lastGameDate = dayjs("2026-09-27");

    const router = useRouter();
    const searchParams = useSearchParams();

    const dateParam = searchParams.get("date");
    const parsed = dateParam ? dayjs(dateParam, "YYYY-MM-DD", true) : null;
    const selectedDate: Dayjs = parsed?.isValid() ? parsed : dayjs();
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const isToday = selectedDate.isSame(dayjs(), "day");
    const atFirstGame = selectedDate.isSame(firstGameDate, "day");
    const atLastGame = selectedDate.isSame(lastGameDate, "day");

    const setSelectedDate = (next: Dayjs) => {
        const clamped = next.isBefore(firstGameDate)
            ? firstGameDate
            : next.isAfter(lastGameDate)
                ? lastGameDate
                : next;
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", clamped.format("YYYY-MM-DD"));
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const [games, setGames] = useState<Game[]>([]);
    const [isCardOpen, setIsCardOpen] = useState(false);

    const handleCardOpen = () => {
        setIsCardOpen(true);
    };

    const handleCardClose = () => {
        setIsCardOpen(false);
    };

    useEffect(() => {
        const fetchGames = async () => {
            const res = await fetch(`/api/games?date=${dateKey}`);
            const data = await res.json();
            setGames(data);
        };

        fetchGames();
    }, [dateKey]);

    const exportSheet = async () => {
        const results = games.map((game) => {
            const {
                awayPitcherAdjustment,
                awayWinProbNoPitcherAdjustment,
                awayWinProbWithPitcherAdjustment,
                homePitcherAdjustment,
                homeWinProbNoPitcherAdjustment,
                homeWinProbWithPitcherAdjustment,
                eloDiffNoPitcherAdjustment,
                eloDiffWithPitcherAdjustment,
            } = getPredictionForExport({
                homeElo: game.homeTeam.TeamELO[0].elo,
                awayElo: game.awayTeam.TeamELO[0].elo,
                homePitcherAverageScore:
                    game.homeStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                homeTeamAveragePitchingScore: game.homeTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
                awayPitcherAverageScore:
                    game.awayStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                awayTeamAveragePitchingScore: game.awayTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
            });
            return [
                selectedDate.format("MM-DD-YYYY"),
                game.awayTeam.abbreviation,
                game.awayTeam.TeamELO[0].elo,
                game.awayStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                game.awayTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
                awayPitcherAdjustment,
                awayWinProbNoPitcherAdjustment,
                awayWinProbWithPitcherAdjustment,
                game.homeTeam.abbreviation,
                game.homeTeam.TeamELO[0].elo,
                game.homeStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                game.homeTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
                homePitcherAdjustment,
                homeWinProbNoPitcherAdjustment,
                homeWinProbWithPitcherAdjustment,
                eloDiffNoPitcherAdjustment,
                eloDiffWithPitcherAdjustment,
            ];
        });

        const csvContent = results
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        // Create a Blob and trigger a download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.setAttribute("download", `daily-export-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, p: 2 }}>
                {/* Calendar Date Picker */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        mb: 3,
                    }}
                >
                    <Box />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedDate(selectedDate.subtract(1, "day"))}
                            disabled={atFirstGame}
                            aria-label="Previous day"
                            sx={{ minWidth: 56, height: 56, p: 0 }}
                        >
                            <ChevronLeftIcon />
                        </Button>
                        <DatePicker
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                            minDate={firstGameDate}
                            maxDate={lastGameDate}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedDate(selectedDate.add(1, "day"))}
                            disabled={atLastGame}
                            aria-label="Next day"
                            sx={{ minWidth: 56, height: 56, p: 0 }}
                        >
                            <ChevronRightIcon />
                        </Button>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 2, pl: 2 }}>
                        {!isToday && (
                            <Button variant="text" onClick={() => setSelectedDate(dayjs())}>
                                Back to Today
                            </Button>
                        )}
                        {SHOW_EXPORT_AND_CARD && (
                            <>
                                <Button variant="outlined" onClick={exportSheet} sx={{ height: 56 }}>
                                    Export
                                </Button>
                                <Button variant="contained" onClick={handleCardOpen} sx={{ height: 56 }}>
                                    Today&apos;s Card
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>

                {/* Game Cards */}
                {games.length === 0 ? (
                    <Typography align="center">No games found for this date.</Typography>
                ) : (
                    <Grid container spacing={2}>
                        {games.map((game) => {
                            const { winProbHome, winProbAway } = getEloPrediction({
                                homeElo: game.homeTeam.TeamELO[0].elo,
                                awayElo: game.awayTeam.TeamELO[0].elo,
                                homePitcherAverageScore:
                                    game.homeStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                                homeTeamAveragePitchingScore:
                                    game.homeTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
                                awayPitcherAverageScore:
                                    game.awayStartingPitcher?.PlayerSeasonPitchingStats[0]?.runningPitcherScore ?? null,
                                awayTeamAveragePitchingScore:
                                    game.awayTeam.TeamSeasonPitchingStats[0].teamPitchingScore,
                            });

                            const awayPitcherStats = game.awayStartingPitcher
                                ? getPitcherStats(
                                      game.awayStartingPitcher.PlayerSeasonPitchingStats[0]?.earnedRuns ?? 0,
                                      game.awayStartingPitcher.PlayerSeasonPitchingStats[0]?.baseOnBalls ?? 0,
                                      game.awayStartingPitcher.PlayerSeasonPitchingStats[0]?.hits ?? 0,
                                      game.awayStartingPitcher.PlayerSeasonPitchingStats[0]?.outs ?? 0,
                                  )
                                : null;

                            const homePitcherStats = game.homeStartingPitcher
                                ? getPitcherStats(
                                      game.homeStartingPitcher.PlayerSeasonPitchingStats[0]?.earnedRuns ?? 0,
                                      game.homeStartingPitcher.PlayerSeasonPitchingStats[0]?.baseOnBalls ?? 0,
                                      game.homeStartingPitcher.PlayerSeasonPitchingStats[0]?.hits ?? 0,
                                      game.homeStartingPitcher.PlayerSeasonPitchingStats[0]?.outs ?? 0,
                                  )
                                : null;

                            return (
                                <Grid item xs={12} sm={6} md={4} key={game.id}>
                                    <Link
                                        href={`/game/${game.id}?date=${dateKey}`}
                                        passHref
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Card
                                            sx={{
                                                p: 2,
                                                transition: "transform 0.2s ease-in-out",
                                                "&:hover": { transform: "scale(1.05)" },
                                                boxShadow: 3,
                                            }}
                                        >
                                            {/* Game Time */}
                                            <Typography
                                                variant="body2"
                                                align="center"
                                                sx={{ fontWeight: "bold", mb: 1 }}
                                            >
                                                {game.status === "FINAL"
                                                    ? (() => {
                                                          const maxInning = game.InningDetails[0]?.inning ?? 9;
                                                          return maxInning > 9 ? `Final/${maxInning}` : "Final";
                                                      })()
                                                    : new Date(game.date).toLocaleTimeString([], {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })}
                                            </Typography>

                                            <Divider />

                                            {/* Teams & Scores */}
                                            {/* Away Team */}
                                            <Box py={2} display={"flex"} flexDirection={"column"}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Image
                                                            src={game.awayTeam.logo_url.toLowerCase()}
                                                            alt={game.awayTeam.abbreviation}
                                                            width={40}
                                                            height={40}
                                                        />
                                                        <Typography variant="h6">
                                                            {game.awayTeam.abbreviation}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                                            {game.awayTeam.TeamRecord[0].wins} -{" "}
                                                            {game.awayTeam.TeamRecord[0].losses} (
                                                            {game.awayTeam.TeamRecord[0].awayWins} -{" "}
                                                            {game.awayTeam.TeamRecord[0].awayLosses})
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h6">{game.awayScore ?? "-"}</Typography>
                                                </Box>
                                                <Typography variant="body2" align="left">
                                                    ELO: {game.awayTeam.TeamELO[0].elo.toFixed(0)}
                                                    {game.status !== "FINAL"
                                                        ? ` | Win Prob: ${winProbAway.toFixed(1)}%`
                                                        : ""}
                                                </Typography>
                                            </Box>

                                            {/* Home Team */}
                                            <Box py={2} display={"flex"} flexDirection={"column"}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Image
                                                            src={game.homeTeam.logo_url.toLowerCase()}
                                                            alt={game.homeTeam.abbreviation}
                                                            width={40}
                                                            height={40}
                                                        />
                                                        <Typography variant="h6">
                                                            {game.homeTeam.abbreviation}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                                            {game.homeTeam.TeamRecord[0].wins} -{" "}
                                                            {game.homeTeam.TeamRecord[0].losses} (
                                                            {game.homeTeam.TeamRecord[0].homeWins} -{" "}
                                                            {game.homeTeam.TeamRecord[0].homeLosses})
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="h6">{game.homeScore ?? "-"}</Typography>
                                                </Box>
                                                <Typography variant="body2" align="left">
                                                    ELO: {game.homeTeam.TeamELO[0].elo.toFixed(0)}
                                                    {game.status !== "FINAL"
                                                        ? ` | Win Prob: ${winProbHome.toFixed(1)}%`
                                                        : ""}
                                                </Typography>
                                            </Box>

                                            <Divider />

                                            {/* Pitcher Info */}
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    mt: 2,
                                                    gap: 2,
                                                }}
                                            >
                                                {/* Away Pitcher */}
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {game.awayStartingPitcher?.photoUrl && (
                                                        <Image
                                                            src={game.awayStartingPitcher.photoUrl}
                                                            alt={game.awayStartingPitcher.lastName}
                                                            width={54}
                                                            height={54}
                                                            style={{ borderRadius: "50%" }}
                                                        />
                                                    )}
                                                    {game.awayStartingPitcher ? (
                                                        <Box flexDirection={"column"}>
                                                            <Typography variant="body2">
                                                                {game.awayStartingPitcher.firstName}{" "}
                                                                {game.awayStartingPitcher.lastName}
                                                            </Typography>
                                                            <Box display={"flex"} flexDirection={"row"} gap={1}>
                                                                <Typography variant="body2">
                                                                    {game.awayStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.wins ?? 0}{" "}
                                                                    -{" "}
                                                                    {game.awayStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.losses ?? 0}{" "}
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {awayPitcherStats?.era ?? "-.--"} ERA
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {awayPitcherStats?.whip ?? "-.--"} WHIP
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {game.awayStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.runningPitcherScore !==
                                                                    undefined
                                                                        ? game.awayStartingPitcher.PlayerSeasonPitchingStats[0].runningPitcherScore.toFixed(
                                                                              1,
                                                                          )
                                                                        : "-.-"}{" "}
                                                                    SCR
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2">TBD</Typography>
                                                    )}
                                                </Box>

                                                {/* Home Pitcher */}
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {game.homeStartingPitcher?.photoUrl && (
                                                        <Image
                                                            src={game.homeStartingPitcher.photoUrl}
                                                            alt={game.homeStartingPitcher.lastName}
                                                            width={54}
                                                            height={54}
                                                            style={{ borderRadius: "50%" }}
                                                        />
                                                    )}
                                                    {game.homeStartingPitcher ? (
                                                        <Box flexDirection={"column"}>
                                                            <Typography variant="body2">
                                                                {game.homeStartingPitcher.firstName}{" "}
                                                                {game.homeStartingPitcher.lastName}
                                                            </Typography>
                                                            <Box display={"flex"} flexDirection={"row"} gap={1}>
                                                                <Typography variant="body2">
                                                                    {game.homeStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.wins ?? 0}{" "}
                                                                    -{" "}
                                                                    {game.homeStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.losses ?? 0}{" "}
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {homePitcherStats?.era ?? "-.--"} ERA
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {homePitcherStats?.whip ?? "-.--"} WHIP
                                                                </Typography>
                                                                <Typography variant="body2">|</Typography>
                                                                <Typography variant="body2">
                                                                    {game.homeStartingPitcher
                                                                        .PlayerSeasonPitchingStats[0]?.runningPitcherScore !==
                                                                    undefined
                                                                        ? game.homeStartingPitcher.PlayerSeasonPitchingStats[0].runningPitcherScore.toFixed(
                                                                              1,
                                                                          )
                                                                        : "-.-"}{" "}
                                                                    SCR
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2">TBD</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Link>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>
            {SHOW_EXPORT_AND_CARD && <BettingCardDialog open={isCardOpen} handleClose={handleCardClose} />}
        </>
    );
}
