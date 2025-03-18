import { prisma } from "@/lib/prisma";
import { Team } from "@prisma/client";

export default async function MLBPage() {
    const mlbLeague = await prisma.league.findFirst({
        where: { abbreviation: "MLB" },
        include: { teams: true },
    });

    const teams: Team[] = mlbLeague?.teams || [];

    return (
        <div>
            <h1>MLB Teams</h1>
            <ul>
                {teams.map((team) => (
                    <li key={team.id}>
                        {team.city} {team.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
