
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { BotConfig, Lead } from "@/models";
import { sendWhatsAppNotification } from "@/lib/gupshup";

const limiter = rateLimit({
    interval: 60 * 1000, 
    uniqueTokenPerInterval: 500, 
});

export async function POST(req: Request) {
    const session = await auth();
    const token = session?.user?.email || req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { isRateLimited, headers } = limiter.check(10, token); 

    if (isRateLimited) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Try again in a minute." },
            { status: 429, headers }
        );
    }

    try {
        const { message, botId, history = [] } = await req.json();

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const groq = new Groq({ apiKey });

        let systemPrompt = "You are a helpful assistant.";
        let internalBotId = null;
        let botSnapshot: any = null;

        // Fetch custom bot from DB
        if (botId && botId !== 'custom') {
           await dbConnect();
           const bot = await BotConfig.findById(botId);
           if (bot) {
               systemPrompt = `${bot.systemPrompt}\n\nCRITICAL INSTRUCTION: Keep all your responses extremely brief, conversational, and highly concise. Never write long essays, large paragraphs, or extensive lists. Respond like a human texting in a chat widget (maximum 2-3 short sentences per message). If explaining features or pricing, give only a high-level summary and ask a quick follow-up question.`;
               internalBotId = bot._id;
               botSnapshot = bot;
           }
        } else {
           // Fallback for landing page testing
           systemPrompt = `You are a helpful assistant. Provide concise answers.`;
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((m: { sender: string; text: string }) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: "user", content: message }
        ];

        // We use function calling to let the AI flag when a user provides contact info
        const tools = [
            {
                type: "function" as const,
                function: {
                    name: "capture_lead_info",
                    description: "Call this function ONLY when the user provides their Name AND Phone Number or Email to be contacted. Do NOT call this if they just say 'Hi my name is John'. Only call when they are expressing intent to be contacted (e.g., 'call me at 555-1234').",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            phone: { type: "string" },
                            email: { type: "string" },
                        },
                        required: ["name"]
                    }
                }
            }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            tools,
            tool_choice: "auto",
        });

        const responseMessage = chatCompletion.choices[0]?.message;
        let text = responseMessage?.content || "";

        // Check if the AI decided to call the lead capture tool
        if (responseMessage?.tool_calls && internalBotId) {
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === 'capture_lead_info') {
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    // Save to MongoDB!
                    try {
                        await Lead.create({
                            botId: internalBotId,
                            name: args.name,
                            phone: args.phone,
                            email: args.email,
                            lastMessage: message,
                            transcript: history.concat({ text: message, sender: 'user' }), // Rough transcript
                            status: "new"
                        });

                        // 💡 WhatsApp Notification Trigger (only if opted-in)
                        if (botSnapshot?.notificationPhone && botSnapshot?.whatsAppOptIn) {
                            sendWhatsAppNotification(botSnapshot.notificationPhone, {
                                name: args.name,
                                phone: args.phone,
                                email: args.email,
                                botName: botSnapshot.name
                            }).catch(console.error); // Fire and forget but log errors
                        }

                        text = "I have successfully saved your contact details. Our team will reach out to you shortly!";
                    } catch (e) {
                        console.error("Failed to save lead", e);
                    }
                }
            }
        }

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
