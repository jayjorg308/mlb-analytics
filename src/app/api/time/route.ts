import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@postgres:5432/${process.env.POSTGRES_DB}`,
});

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()"); // Simple test query
        client.release();

        return NextResponse.json({ success: true, time: result.rows[0].now });
    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 500 });
    }
}
