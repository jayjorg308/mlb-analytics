import Image from "next/image";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import type { GameWithRelations } from "../_data";

type InningDetail = GameWithRelations["InningDetails"][number];
type Team = GameWithRelations["homeTeam"];
type Side = "away" | "home";
type SumField = "homeRuns" | "awayRuns" | "homeHits" | "awayHits" | "homeErrors" | "awayErrors";

export default function BoxScoreTable({
    innings,
    homeTeam,
    awayTeam,
}: {
    innings: InningDetail[];
    homeTeam: Team;
    awayTeam: Team;
}) {
    const maxInning = innings.length > 0 ? Math.max(...innings.map((i) => i.inning)) : 9;
    const columnCount = Math.max(9, maxInning);
    const inningNumbers = Array.from({ length: columnCount }, (_, i) => i + 1);
    const inningByNumber = new Map(innings.map((i) => [i.inning, i]));

    const sumField = (field: SumField) =>
        innings.reduce((acc, row) => acc + (row[field] ?? 0), 0);

    const awayR = sumField("awayRuns");
    const homeR = sumField("homeRuns");
    const awayH = sumField("awayHits");
    const homeH = sumField("homeHits");
    const awayE = sumField("awayErrors");
    const homeE = sumField("homeErrors");

    const lastInning = inningByNumber.get(maxInning);
    const homeDidNotBatLastInning =
        !!lastInning && lastInning.homeRuns === null && lastInning.awayRuns !== null;

    const renderTeamRow = (side: Side, team: Team, totals: { r: number; h: number; e: number }) => (
        <TableRow>
            <TableCell sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 130 }}>
                <Image
                    src={team.logo_url.toLowerCase()}
                    alt={team.abbreviation}
                    width={28}
                    height={28}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {team.abbreviation}
                </Typography>
            </TableCell>
            {inningNumbers.map((num) => {
                const row = inningByNumber.get(num);
                const value = side === "away" ? row?.awayRuns : row?.homeRuns;
                const showX =
                    side === "home" && num === maxInning && homeDidNotBatLastInning && value == null;
                return (
                    <TableCell key={num} align="center" sx={{ minWidth: 32, px: 1 }}>
                        {showX ? "X" : (value ?? 0)}
                    </TableCell>
                );
            })}
            <TableCell align="center" sx={{ fontWeight: 700, borderLeft: "1px solid", borderColor: "divider" }}>
                {totals.r}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
                {totals.h}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
                {totals.e}
            </TableCell>
        </TableRow>
    );

    return (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell />
                        {inningNumbers.map((num) => (
                            <TableCell key={num} align="center" sx={{ fontWeight: 600, px: 1 }}>
                                {num}
                            </TableCell>
                        ))}
                        <TableCell
                            align="center"
                            sx={{ fontWeight: 700, borderLeft: "1px solid", borderColor: "divider" }}
                        >
                            R
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                            H
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                            E
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {renderTeamRow("away", awayTeam, { r: awayR, h: awayH, e: awayE })}
                    {renderTeamRow("home", homeTeam, { r: homeR, h: homeH, e: homeE })}
                </TableBody>
            </Table>
        </Paper>
    );
}
