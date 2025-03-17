import { DATABASE_URL } from "@/app/shared/serverUtils";
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: DATABASE_URL,
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
