import { PrismaClient, BattingHand, ThrowingHand } from "@prisma/client";
import fetch from "node-fetch";

interface RosterPlayer {
    person: {
        id: number;
    };
    jerseyNumber?: string;
    position: {
        code: string;
        name: string;
        type: string;
        abbreviation: string;
    };
}

interface RosterResponse {
    roster: RosterPlayer[];
}

interface PlayerDetail {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: string; // ISO date string
    birthCity: string;
    birthStateProvince: string;
    birthCountry: string;
    height: string; // e.g., "6' 2\""
    weight: number;
    primaryPosition: {
        code: string;
        name: string;
        type: string;
        abbreviation: string;
    };
    mlbDebutDate: string;
    currentTeam: {
        id: number;
    };
    useName: string;
    fullFMLName: string;
    boxscoreName: string;
    nickName: string;
    gender: string;
    isActive: boolean;
    isPlayer: boolean;
    isVerified: boolean;
    primaryNumber: string;
    batSide: {
        code: string; // "R", "L", "S"
        description: string;
    };
    pitchHand: {
        code: string; // "R", "L"
        description: string;
    };
}

interface PlayerDetailsResponse {
    people: PlayerDetail[];
}

const prisma = new PrismaClient();

// Helper: Convert hand string to enum
const parseHand = (hand: string | null): BattingHand | ThrowingHand | null => {
    if (!hand) return null;
    if (hand === "R") return "RIGHT";
    if (hand === "L") return "LEFT";
    if (hand === "S") return "SWITCH";
    return null;
};

const seedMLBPlayers = async () => {
    try {
        console.log("Fetching MLB teams from DB...");
        const teams = await prisma.team.findMany({
            where: {
                league: { name: "Major League Baseball" },
            },
        });

        for (const team of teams) {
            if (!team.mlb_api_id) continue;

            console.log(`Fetching roster for ${team.name}...`);
            const rosterRes = await fetch(`https://statsapi.mlb.com/api/v1/teams/${team.mlb_api_id}/roster/40Man`);
            const rosterData: RosterResponse = (await rosterRes.json()) as RosterResponse;

            for (const playerEntry of rosterData.roster) {
                const playerId = playerEntry.person.id;

                const playerDetailsRes = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}`);
                const playerDetailsData: PlayerDetailsResponse =
                    (await playerDetailsRes.json()) as PlayerDetailsResponse;
                const player = playerDetailsData.people[0];

                // Handle position(s)
                const positions: string[] = [];

                if (player.primaryPosition) {
                    positions.push(player.primaryPosition.abbreviation);
                }

                if (player.primaryPosition.abbreviation === "TWP") {
                    // Two-way player (pitcher + hitter)
                    positions.push("P", "DH");
                }

                const birthDate = new Date(player.birthDate);

                // Create or update player
                const createdPlayer = await prisma.player.upsert({
                    where: { mlb_person_id: playerId },
                    update: {
                        firstName: player.firstName,
                        lastName: player.lastName,
                        birthDate,
                        birthCity: player.birthCity || "",
                        birthState: player.birthStateProvince || "",
                        birthCountry: player.birthCountry || "",
                        height: player.height ? parseInt(player.height.replace(/[^0-9]/g, "")) : null,
                        weight: player.weight || null,
                        debutDate: player.mlbDebutDate ? new Date(player.mlbDebutDate) : null,
                        uniformNumber: player.primaryNumber ? parseInt(player.primaryNumber) : null,
                        photoUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/${playerId}/headshot/67/current`,
                        battingHand: parseHand(player.batSide?.code),
                        throwingHand: parseHand(player.pitchHand?.code),
                        team: {
                            connect: { mlb_api_id: team.mlb_api_id },
                        },
                    },
                    create: {
                        mlb_person_id: playerId,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        birthDate,
                        birthCity: player.birthCity || "",
                        birthState: player.birthStateProvince || "",
                        birthCountry: player.birthCountry || "",
                        height: player.height ? parseInt(player.height.replace(/[^0-9]/g, "")) : null,
                        weight: player.weight || null,
                        debutDate: player.mlbDebutDate ? new Date(player.mlbDebutDate) : null,
                        uniformNumber: player.primaryNumber ? parseInt(player.primaryNumber) : null,
                        photoUrl: `https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/${playerId}/headshot/67/current`,
                        battingHand: parseHand(player.batSide?.code),
                        throwingHand: parseHand(player.pitchHand?.code),
                        team: {
                            connect: { mlb_api_id: team.mlb_api_id },
                        },
                    },
                });

                // Attach positions
                for (const abbrev of positions) {
                    const position = await prisma.position.findFirst({
                        where: {
                            abbreviation: abbrev,
                            sport: "BASEBALL",
                        },
                    });

                    if (position) {
                        await prisma.playerPosition.upsert({
                            where: {
                                playerId_positionId: {
                                    playerId: createdPlayer.id,
                                    positionId: position.id,
                                },
                            },
                            update: {},
                            create: {
                                playerId: createdPlayer.id,
                                positionId: position.id,
                            },
                        });
                    }
                }
                console.log(`Seeded ${player.firstName} ${player.lastName}`);
            }
        }

        console.log("MLB player seeding complete!");
    } catch (error) {
        console.error("Error seeding players:", error);
    } finally {
        await prisma.$disconnect();
    }
};

seedMLBPlayers();
