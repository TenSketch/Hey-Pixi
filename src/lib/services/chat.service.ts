import Groq from "groq-sdk";
import { BotConfig } from "@/models";
import dbConnect from "@/lib/mongodb";
import { LeadService } from "./lead.service";
import { BadRequestError, NotFoundError } from "@/lib/errors";

export class ChatService {
  private static groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY,
    timeout: 30000 // 30 second timeout
  });

  static async generateResponse(message: string, botId: string | null, history: any[] = []) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY missing");
    }

    let systemPrompt = "You are a helpful assistant.";
    let botSnapshot: any = null;

    // Fetch custom bot from DB if botId provided
    if (botId && botId !== 'custom') {
      await dbConnect();
      botSnapshot = await BotConfig.findById(botId);
      if (!botSnapshot) {
        throw new NotFoundError("Bot configuration not found");
      }
      systemPrompt = `${botSnapshot.systemPrompt}\n\nCRITICAL INSTRUCTION: Keep all your responses extremely brief, conversational, and highly concise. Never write long essays, large paragraphs, or extensive lists. Respond like a human texting in a chat widget (maximum 2-3 short sentences per message). If explaining features or pricing, give only a high-level summary and ask a quick follow-up question.\n\nTOOL USE INSTRUCTION: If you have collected the user's name and contact information (phone or email), YOU MUST use the 'capture_lead_info' tool immediately. Do NOT format the tool call as text in your message. Use the provided tool calling interface.`;
    }

    // SLIDING WINDOW: Keep only the last 10 messages of history
    const truncatedHistory = history.slice(-10);

    const messages = [
      { role: "system", content: systemPrompt },
      ...truncatedHistory.map((m: { sender: string; text: string }) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: "user", content: message }
    ] as any[];

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "capture_lead_info",
          description: "Captures user contact details. Call this ONLY when you have at least a Name AND either a Phone number or Email.",
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

    const chatCompletion = await this.groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      tools,
      tool_choice: "auto",
    });

    const responseMessage = chatCompletion.choices[0]?.message;
    let text = responseMessage?.content || "";

    // Handle Tool Calls (with deduplication)
    let leadCapturedThisTurn = false;

    if (responseMessage?.tool_calls && botSnapshot) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'capture_lead_info' && !leadCapturedThisTurn) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Only proceed if we have at least name + (phone or email)
            if (args.name && (args.phone || args.email)) {
              await LeadService.captureLead({
                botId: botSnapshot._id,
                name: args.name,
                phone: args.phone,
                email: args.email,
                lastMessage: message,
                history: truncatedHistory,
                botSnapshot: botSnapshot
              });

              leadCapturedThisTurn = true;
              text = "I have successfully saved your contact details. Our team will reach out to you shortly!";
            }
          } catch (e) {
            console.error("Failed to process lead tool call:", e);
          }
        }
      }
    }

    return text;
  }
}
