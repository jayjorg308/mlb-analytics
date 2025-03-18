import { prisma } from "@/lib/prisma";
import { Team } from "@prisma/client";

export default async function NBAPage() {
    const nbaLeague = await prisma.league.findFirst({
        where: { abbreviation: "NBA" },
        include: { teams: true },
    });

    const teams: Team[] = nbaLeague?.teams || [];

    return (
        <div>
            <h1>NBA Teams</h1>
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
