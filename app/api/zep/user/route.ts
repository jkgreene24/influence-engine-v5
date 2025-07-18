import { NextRequest, NextResponse } from "next/server";
import zepManager from "@/lib/zep/zep_manager";

export async function POST(request: NextRequest) {
    try {
        const { userId, email, first_name, last_name, metadata } = await request.json();
        await zepManager.upsertUser(userId, email, first_name, last_name, metadata);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error upserting Zep user:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}