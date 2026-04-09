import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { ChatService } from "@/lib/services/chat.service";
import { AppError } from "@/lib/errors";

const limiter = rateLimit({
    interval: 60 * 1000, 
    uniqueTokenPerInterval: 500, 
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        const token = session?.user?.email || req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { isRateLimited, headers } = limiter.check(10, token); 

        if (isRateLimited) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Try again in a minute." },
                { status: 429, headers }
            );
        }

        const body = await req.json();
        const { message, botId, history = [] } = body;

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const result = await ChatService.generateResponse(message, botId, history);

        return NextResponse.json({ result }, { headers });
    } catch (error: any) {
        console.error("API Error (Chat):", error);
        
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        const message = error instanceof AppError ? error.message : "Internal Server Error";
        
        return NextResponse.json({ error: message }, { status: statusCode });
    }
}
