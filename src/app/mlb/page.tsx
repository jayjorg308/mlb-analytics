"use client";
import { Team } from "@prisma/client";
import { useEffect, useState } from "react";

export default function MLBPage() {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const fetchTeams = async () => {
            const res = await fetch("/api/mlb/teams");
            const data = await res.json();
            setTeams(data);
        };

        fetchTeams();
    }, []);

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
