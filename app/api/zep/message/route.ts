import { NextRequest, NextResponse } from "next/server";
import zepManager from "@/lib/zep/zep_manager";

export async function POST(request: NextRequest) {
    try {
        console.log("Adding Zep message");
        const { userId, sessionId, content, role, userName } = await request.json();
        const session = await zepManager.upsertSession(userId, sessionId);
        if (!session) {
            throw new Error("Session is undefined");
        }
        await zepManager.addMessage(sessionId, content, role, userName);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding Zep message:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}