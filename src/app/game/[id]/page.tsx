// import { notFound } from "next/navigation";
// import { Box, Typography, Divider } from "@mui/material";
// import Image from "next/image";
// import { prisma } from "@/lib/prisma"; // Ensure you have Prisma setup

// type Params = Promise<{ slug: string }>;
// type GameParams = Promise<{ id: string }>;

// export default async function GameDetail(props: { params: Params; gameParams: GameParams }) {
//     const params = await props.params;
//     const gameParams = await props.gameParams;

//     console.log(params);
//     const gameId = parseInt(gameParams.id, 10);
//     if (isNaN(gameId)) return notFound();

//     const game = await prisma.game.findUnique({
//         where: { id: gameId },
//         include: {
//             homeTeam: true,
//             awayTeam: true,
//             homeStartingPitcher: true,
//             awayStartingPitcher: true,
//         },
//     });

//     if (!game) return notFound();

//     const homePitcher = game.homeStartingPitcher;
//     const awayPitcher = game.awayStartingPitcher;

//     const awayLineup = game.battingOrderAway;
//     const awayPlayers =
//         awayLineup && awayLineup.length > 0
//             ? await prisma.player.findMany({
//                   where: { id: { in: awayLineup } },
//               })
//             : [];

//     const homeLineup = game.battingOrderHome;
//     const homePlayers =
//         homeLineup && homeLineup.length > 0
//             ? await prisma.player.findMany({
//                   where: { id: { in: homeLineup } },
//               })
//             : [];

//     return (
//         <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, p: 2 }}>
//             <Typography variant="h4" align="center" sx={{ mb: 2 }}>
//                 {game.awayTeam.name} @ {game.homeTeam.name}
//             </Typography>

//             <Divider sx={{ my: 2 }} />

//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
//                 {/* Away Team */}
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                     <Image src={game.awayTeam.logo_url} alt={game.awayTeam.name} width={60} height={60} />
//                     <Typography variant="h6">{game.awayTeam.name}</Typography>
//                 </Box>
//                 <Typography variant="h6">{game.awayScore ?? "-"}</Typography>
//             </Box>

//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
//                 {/* Home Team */}
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                     <Image src={game.homeTeam.logo_url} alt={game.homeTeam.name} width={60} height={60} />
//                     <Typography variant="h6">{game.homeTeam.name}</Typography>
//                 </Box>
//                 <Typography variant="h6">{game.homeScore ?? "-"}</Typography>
//             </Box>

//             <Divider sx={{ my: 2 }} />

//             {/* Pitcher Info */}
//             <Typography variant="h6" align="center">
//                 Starting Pitchers
//             </Typography>
//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
//                 <Typography variant="body2">
//                     {awayPitcher
//                         ? `${awayPitcher.uniformNumber} ${awayPitcher.firstName} ${awayPitcher.lastName}`
//                         : "TBD"}
//                 </Typography>
//                 <Typography variant="body2">vs.</Typography>
//                 <Typography variant="body2">
//                     {homePitcher
//                         ? `${homePitcher.uniformNumber} ${homePitcher.firstName} ${homePitcher.lastName}`
//                         : "TBD"}
//                 </Typography>
//             </Box>

//             <Divider sx={{ my: 2 }} />

//             {/* Pitcher Info */}
//             <Typography variant="h6" align="center">
//                 Starting Lineup
//             </Typography>
//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
//                 <Box sx={{ width: "45%" }}>
//                     <Typography variant="subtitle1" align="center">
//                         {game.awayTeam.name} Lineup
//                     </Typography>
//                     {awayPlayers ? (
//                         awayPlayers.map((player, index) => (
//                             <Typography key={index} variant="body2">
//                                 {player.uniformNumber} {player.firstName} {player.lastName}{" "}
//                                 {player.position ? `(${player.position})` : ""}
//                             </Typography>
//                         ))
//                     ) : (
//                         <Typography variant="body2">No lineup available</Typography>
//                     )}
//                 </Box>

//                 <Box sx={{ width: "45%" }}>
//                     <Typography variant="subtitle1" align="center">
//                         {game.homeTeam.name} Lineup
//                     </Typography>
//                     {homePlayers ? (
//                         homePlayers.map((player, index) => (
//                             <Typography key={index} variant="body2">
//                                 {player.uniformNumber} {player.firstName} {player.lastName}{" "}
//                                 {player.position ? `(${player.position})` : ""}
//                             </Typography>
//                         ))
//                     ) : (
//                         <Typography variant="body2">No lineup available</Typography>
//                     )}
//                 </Box>
//             </Box>
//         </Box>
//     );
// }
