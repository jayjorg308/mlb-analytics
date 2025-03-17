import { DATABASE_URL } from "@/app/shared/serverUtils";
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: DATABASE_URL,
});

export async function GET() {
    try {
        const res = await pool.query(`
      SELECT teams.* FROM teams
      JOIN leagues ON teams.league_id = leagues.id
      WHERE leagues.abbreviation = 'NBA'
    `);
        return NextResponse.json({ success: true, teams: res.rows });
    } catch (err) {
        return NextResponse.json({ success: false, error: err });
    }
}
