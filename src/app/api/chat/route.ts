import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { ChatService } from "@/lib/services/chat.service";
import { AppError } from "@/lib/errors";
import { LIMITS } from "@/lib/constants";

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

        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // SECURITY: Limit input length to prevent token bloat/abuse
        if (message.length > LIMITS.MAX_CHAT_MESSAGE_LENGTH) {
            return NextResponse.json({ error: `Message is too long (max ${LIMITS.MAX_CHAT_MESSAGE_LENGTH} characters)` }, { status: 400 });
        }

        // SECURITY: Validate and sanitize history array
        if (!Array.isArray(history)) {
            return NextResponse.json({ error: "History must be an array" }, { status: 400 });
        }

        const sanitizedHistory = history
            .slice(0, LIMITS.MAX_CHAT_HISTORY_ITEMS)
            .filter((h: unknown): h is { text: string; sender: string } => 
                h !== null && typeof h === 'object' && 
                'text' in h && typeof (h as Record<string, unknown>).text === 'string' &&
                'sender' in h && typeof (h as Record<string, unknown>).sender === 'string'
            )
            .map((h) => ({
                text: String(h.text).substring(0, LIMITS.MAX_CHAT_MESSAGE_LENGTH),
                sender: (h.sender === 'user' ? 'user' : 'bot') as 'user' | 'bot'
            }));

        const result = await ChatService.generateResponse(message, botId, sanitizedHistory);

        return NextResponse.json({ result }, { headers });
    } catch (error: unknown) {
        console.error("API Error (Chat):", error);
        
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        const message = error instanceof AppError ? error.message : "Internal Server Error";
        
        return NextResponse.json({ error: message }, { status: statusCode });
    }
}
