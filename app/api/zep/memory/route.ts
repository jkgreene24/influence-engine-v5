import { NextRequest, NextResponse } from "next/server";
import zepManager from "@/lib/zep/zep_manager";

export async function POST(request: NextRequest) {
    try {
        const { sessionId, userId } = await request.json();
        const memoryContext = await zepManager.getMemoryContext(sessionId, userId);
        return NextResponse.json({ success: true, memory: memoryContext });
    } catch (error) {
        console.error("Error adding Zep message:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}