import { PrismaClient } from "@prisma/client";
import axios from "axios";

interface Player {
    id: number;
}

type PlayerStatus = {
    code: string;
    description: string;
};

type PlayerPosition = {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
};

type PlayerPerson = {
    id: number;
    fullName: string;
    link: string;
};

type RosterPlayer = {
    person: PlayerPerson;
    jerseyNumber: string;
    position: PlayerPosition;
    status: PlayerStatus;
    parentTeamId: number;
    note?: string; // Optional field
};

type RosterResponse = {
    roster: RosterPlayer[];
};

const prisma = new PrismaClient();

function splitName(fullName: string): { firstName: string; lastName: string } {
    const [firstName, ...lastNameParts] = fullName.split(" ");
    const lastName = lastNameParts.join(" "); // Join remaining parts as lastName

    return {
        firstName,
        lastName,
    };
}

function getTeamIdFromMlbApiId(mlbApiId: number): Promise<number> {
    return prisma.team
        .findUnique({
            where: { mlb_api_id: mlbApiId },
            select: { id: true },
        })
        .then((team) => (team ? team.id : 0));
}

const checkRosters = async (awayTeamId: number, homeTeamId: number) => {
    try {
        const [awayRosterRes, homeRosterRes] = await Promise.all([
            axios.get(`https://statsapi.mlb.com/api/v1/teams/${awayTeamId}/roster/40Man`),
            axios.get(`https://statsapi.mlb.com/api/v1/teams/${homeTeamId}/roster/40Man`),
        ]);

        const awayRosterData: RosterResponse = awayRosterRes.data;
        const homeRosterData: RosterResponse = homeRosterRes.data;

        const allPlayers = [...awayRosterData.roster, ...homeRosterData.roster];

        // Extract MLB API IDs
        const playerApiIds = allPlayers.map((player) => player.person.id);

        // Fetch existing player records
        const existingPlayers = await prisma.player.findMany({
            where: { mlb_api_id: { in: playerApiIds } },
            select: { mlb_api_id: true },
        });

        // Determine missing players
        const existingPlayerIds = new Set(existingPlayers.map((p) => p.mlb_api_id));
        const missingPlayers = allPlayers.filter((player) => !existingPlayerIds.has(player.person.id));

        if (missingPlayers.length > 0) {
            // Map team IDs before inserting players
            const teamIdMap: Record<number, number> = {};
            for (const player of missingPlayers) {
                if (!teamIdMap[player.parentTeamId]) {
                    teamIdMap[player.parentTeamId] = await getTeamIdFromMlbApiId(player.parentTeamId);
                }
            }

            // Batch insert missing players
            await prisma.player.createMany({
                data: missingPlayers.map((player) => ({
                    mlb_api_id: player.person.id,
                    firstName: splitName(player.person.fullName).firstName,
                    lastName: splitName(player.person.fullName).lastName,
                    position: player.position.abbreviation,
                    uniformNumber: parseInt(player.jerseyNumber as string),
                    teamId: teamIdMap[player.parentTeamId] || null, // Ensure teamId is resolved
                    photoUrl: ``,
                })),
                skipDuplicates: true,
            });

            console.log(`Inserted ${missingPlayers.length} new players into the database.`);
        } else {
            console.log("All players already exist in the database.");
        }
    } catch (error) {
        console.error("Error checking rosters:", error);
    }
};

// Function to map MLB API IDs to internal Player IDs
const mapMlbApiIdsToPlayerIds = async (mlbApiIds: number[]): Promise<Record<number, number>> => {
    const players = await prisma.player.findMany({
        where: { mlb_api_id: { in: mlbApiIds } },
        select: { id: true, mlb_api_id: true },
    });

    return Object.fromEntries(players.map((player) => [player.mlb_api_id, player.id]));
};

export async function updateLineupsAndPitchers() {
    try {
        const today = new Date().toLocaleDateString();
        const { data } = await axios.get(
            `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=probablePitcher,lineups&startDate=${today}&endDate=${today}&gameType=R`,
        );

        const { dates } = data;
        if (!dates || dates.length === 0) return;

        const games = dates[0].games;
        if (!games || games.length === 0) return;

        for (const game of games) {
            // Check if game exists
            const existingGame = await prisma.game.findUnique({
                where: { mlb_api_id: game.gamePk },
            });

            if (!existingGame) continue;

            // check current 40 man rosters to see if we have all of the players in our db
            await checkRosters(game.teams.away.team.id, game.teams.home.team.id);

            const homePitcherApiId = game.teams.home.probablePitcher?.id;
            const awayPitcherApiId = game.teams.away.probablePitcher?.id;

            // Collect all player IDs for batch query
            const playerApiIds: number[] = [];
            if (homePitcherApiId) playerApiIds.push(homePitcherApiId);
            if (awayPitcherApiId) playerApiIds.push(awayPitcherApiId);

            if (game.lineups?.homePlayers) {
                playerApiIds.push(...game.lineups.homePlayers.map((player: Player) => player.id));
            }
            if (game.lineups?.awayPlayers) {
                playerApiIds.push(...game.lineups.awayPlayers.map((player: Player) => player.id));
            }

            // Map MLB API IDs to internal player IDs
            const playerIdMap = await mapMlbApiIdsToPlayerIds(playerApiIds);

            // Assign pitchers
            const homePitcherId = playerIdMap[homePitcherApiId!] || null;
            const awayPitcherId = playerIdMap[awayPitcherApiId!] || null;

            // Assign batting orders
            const homeBattingOrder: number[] = game.lineups?.homePlayers
                ? game.lineups.homePlayers
                      .map((player: Player) => playerIdMap[player.id] || null)
                      .filter((id: number | null): id is number => id !== null)
                : [];
            const awayBattingOrder: number[] = game.lineups?.awayPlayers
                ? game.lineups.awayPlayers
                      .map((player: Player) => playerIdMap[player.id] || null)
                      .filter((id: number | null): id is number => id !== null)
                : [];

            // Update game
            await prisma.game.update({
                where: { mlb_api_id: game.gamePk },
                data: {
                    startingPitcherHomeId: homePitcherId,
                    startingPitcherAwayId: awayPitcherId,
                    battingOrderHome: homeBattingOrder,
                    battingOrderAway: awayBattingOrder,
                },
            });

            console.log(`Updated game ${game.gamePk} w/ pitchers ${homePitcherId} and ${awayPitcherId}`);
        }
    } catch (error) {
        console.error("Error updating probable pitchers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    updateLineupsAndPitchers();
}
