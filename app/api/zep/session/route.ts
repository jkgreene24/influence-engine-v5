import { NextRequest, NextResponse } from "next/server";
import zepManager from "@/lib/zep/zep_manager";

export async function POST(request: NextRequest) {
    try {
        const { userId, sessionId } = await request.json();
        const session = await zepManager.createSession(userId, sessionId);
        console.log("Zep session created", session);
        return NextResponse.json({ success: true, session });
    } catch (error) {
        console.error("Error creating Zep session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}