import { NextRequest, NextResponse } from "next/server";
import zepManager from "@/lib/zep/zep_manager";

export async function POST(request: NextRequest) {
    try {
        const { sessionId, userId } = await request.json();
        const memoryContext = await zepManager.getMemoryContext(sessionId, userId);
        return NextResponse.json({ success: true, memory: memoryContext || null });
    } catch (error) {
        console.error("Error getting Zep memory context:", error);
        return NextResponse.json(
            { success: false, memory: null },
            { status: 500 }
        );
    }
}