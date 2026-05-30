import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 2026 starting ELOs, keyed by abbreviation
const teamELO: { abbreviation: string; elo: number }[] = [
    { abbreviation: "ARI", elo: 1508.497990 },
    { abbreviation: "ATH", elo: 1496.329883 },
    { abbreviation: "ATL", elo: 1505.881497 },
    { abbreviation: "BAL", elo: 1493.799785 },
    { abbreviation: "BOS", elo: 1527.867743 },
    { abbreviation: "CHC", elo: 1529.578148 },
    { abbreviation: "CHW", elo: 1467.441171 },
    { abbreviation: "CIN", elo: 1507.513967 },
    { abbreviation: "CLE", elo: 1513.655539 },
    { abbreviation: "COL", elo: 1419.851802 },
    { abbreviation: "DET", elo: 1505.530823 },
    { abbreviation: "HOU", elo: 1508.800799 },
    { abbreviation: "KC", elo: 1511.493709 },
    { abbreviation: "LAA", elo: 1462.897755 },
    { abbreviation: "LAD", elo: 1551.629821 },
    { abbreviation: "MIA", elo: 1492.546809 },
    { abbreviation: "MIL", elo: 1538.481357 },
    { abbreviation: "MIN", elo: 1474.981448 },
    { abbreviation: "NYM", elo: 1510.661705 },
    { abbreviation: "NYY", elo: 1533.975627 },
    { abbreviation: "PHI", elo: 1537.646083 },
    { abbreviation: "PIT", elo: 1493.286687 },
    { abbreviation: "SD", elo: 1526.126033 },
    { abbreviation: "SEA", elo: 1524.656303 },
    { abbreviation: "SF", elo: 1504.741355 },
    { abbreviation: "STL", elo: 1487.844851 },
    { abbreviation: "TB", elo: 1500.932182 },
    { abbreviation: "TEX", elo: 1513.112978 },
    { abbreviation: "TOR", elo: 1540.571743 },
    { abbreviation: "WSH", elo: 1459.662950 },
];

// Abbreviations that differ between the source ELO data and MLB's API
const ABBR_ALIASES: Record<string, string> = {
    ARI: "AZ",
    CHW: "CWS",
};

async function seedTeamELO() {
    try {
        const teams = await prisma.team.findMany();

        for (const team of teams) {
            const elo =
                teamELO.find((t) => (ABBR_ALIASES[t.abbreviation] ?? t.abbreviation) === team.abbreviation)?.elo ??
                null;

            if (!elo) {
                console.log(`No ELO found for team ${team.name} (${team.abbreviation})`);
                continue;
            }

            await prisma.teamELO.create({
                data: {
                    teamId: team.id,
                    seasonId: 1,
                    elo: elo,
                    eloChange: 0,
                },
            });

            console.log(`Seeded game ELO for team ${team.name}`);
        }

        console.log("✅ Finished seeding Team ELOs.");
    } catch (error) {
        console.error("❌ Error seeding Team ELOs:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTeamELO();
