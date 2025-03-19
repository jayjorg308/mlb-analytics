import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MLB_TEAMS_ENDPOINT = "https://statsapi.mlb.com/api/v1/teams?sportId=1";
const ROSTER_ENDPOINT = (teamId: number) => `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`;

const PLAYER_INFO_ENDPOINT = (playerId: number) => `https://statsapi.mlb.com/api/v1/people/${playerId}`;

async function main() {
    const { data: teamsData } = await axios.get(MLB_TEAMS_ENDPOINT);
    const teams = teamsData.teams;

    for (const team of teams) {
        const teamId = team.id;

        const { data: rosterData } = await axios.get(ROSTER_ENDPOINT(teamId));
        const roster = rosterData.roster;

        for (const player of roster) {
            const playerId = player.person.id;

            // Get full player details for batting/throwing hand, etc.
            const { data: playerDetailsData } = await axios.get(PLAYER_INFO_ENDPOINT(playerId));
            const playerDetails = playerDetailsData.people[0];

            const fullName = playerDetails.fullName;
            const [firstName, ...rest] = fullName.split(" ");
            const lastName = rest.join(" ");
            //const primaryPosition = playerDetails.primaryPosition.abbreviation; // e.g., "P"
            const batSide = playerDetails.batSide.code; // "L", "R", or "S"
            const pitchHand = playerDetails.pitchHand.code; // "L", "R"

            // const headshotUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/${playerId}/headshot/67/current.png`;

            try {
                await prisma.player.create({
                    data: {
                        firstName,
                        lastName,
                        mlb_person_id: playerId,
                        birthDate: new Date(playerDetails.birthDate),
                        age: playerDetails.currentAge,
                        height: playerDetails.height,
                        weight: playerDetails.weight,
                        birthCity: playerDetails.birthCity,
                        birthCountry: playerDetails.birthCountry,
                        birthState: playerDetails.birthStateProvince,
                        debutDate: new Date(playerDetails.debutDate),
                        uniformNumber: playerDetails.primaryNumber,
                        battingHand: batSide,
                        throwingHand: pitchHand,
                        // photo_url: headshotUrl
                        // team: {
                        //     connect: { mlb_api_id: teamId },
                        // },
                        // positions: {
                        //     connectOrCreate: {
                        //         where: { name: primaryPosition },
                        //         create: { name: primaryPosition },
                        //     },
                        // },
                    },
                });

                console.log(`Inserted: ${fullName}`);
            } catch (error) {
                console.error(`Error inserting ${fullName}:`, error);
            }
        }
    }

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    prisma.$disconnect();
});
