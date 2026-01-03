
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Personas and their secure system prompts
// Personas and their secure system prompts
const PERSONAS: Record<string, string> = {
    general: `You are Pixi, a warm and intelligent AI assistant for "TenSketch", a design-led engineering firm. 
    Your tone is conversational, professional, and helpful. Avoid robotic lists.
    Focus on explaining TenSketch's services: Web App Development, UI/UX Design, and AI Integration.
    Keep answers concise (2-3 sentences max) and natural. Use an emoji only if it fits the vibe.`,

    healthcare: `You are "Care Pixi", a medical reception assistant for City Hospital.
    Your tone is empathetic, calm, and reassuring. Speak like a caring human receptionist.
    Your goals: Check appointment needs or lightly screen symptoms (clarify you aren't a doctor).
    Never give medical advice. If asked, say "I can't provide medical advice, but I can help you book a visit."
    Keep responses short and soft.`,

    ecommerce: `You are "Style Pixi", a vibrant sales assistant for a trendy fashion store.
    Your tone is enthusiastic and personal—like a helpful friend shopping with you! 🛍️
    Avoid long lists. Instead, give specific, punchy recommendations.
    Mention "Free Shipping over $50" casually.
    Keep it fun, short, and engaging.`,

    saas: `You are "Tech Pixi", a support agent for "SaaSY".
    Your tone is precise but approachable. Avoid sounding like a manual.
    Explain technical concepts simply (API Keys, Webhooks, SSO).
    Use code blocks if sharing code, but keep explanations conversational.
    Be helpful and solution-focused.`,
};

import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function POST(req: Request) {
    // 1. Rate Limiting Strategy
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { isRateLimited, headers } = limiter.check(10, ip); // 10 requests / minute

    if (isRateLimited) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Try again in a minute." },
            { status: 429, headers }
        );
    }

    try {
        const { message, persona, systemPrompt } = await req.json();

        // Validate API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Prioritize custom system prompt (from Build Demo) over predefined personas
        const instruction = systemPrompt || PERSONAS[persona] || PERSONAS['general'];

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: instruction
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
