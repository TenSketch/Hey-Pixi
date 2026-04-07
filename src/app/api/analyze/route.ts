import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import * as cheerio from "cheerio";
import axios from "axios";
import Groq from "groq-sdk";

const limiter = rateLimit({
    interval: 60 * 1000, 
    uniqueTokenPerInterval: 200, 
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { isRateLimited, headers } = limiter.check(3, ip); 

    if (isRateLimited) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Highly intensive analysis is limited to 3 per minute." },
            { status: 429, headers }
        );
    }
    const { url, role, botName } = await req.json();

    if (!url || !role) {
      return NextResponse.json({ error: "Missing url or role" }, { status: 400 });
    }

    // 1. Scrape the website text
    let websiteContent = "No specific website content available. Rely on general knowledge.";
    
    try {
        // Enforce http/https
        const targetUrl = url.startsWith("http") ? url : `https://${url}`;
        const response = await axios.get(targetUrl, { timeout: 8000 });
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Remove scripts, styles, etc.
        $("script, style, noscript, iframe, img, svg, video").remove();
        
        const rawText = $("body").text();
        // Clean up whitespace
        websiteContent = rawText.replace(/\s+/g, " ").trim().substring(0, 10000); // Limit to 10k chars
    } catch (scrapeError: unknown) {
        const message = scrapeError instanceof Error ? scrapeError.message : String(scrapeError);
        console.warn(`Scraping failed for ${url}:`, message);
        // Fallback to generalized prompt if scrape fails (e.g. anti-bot protections)
        websiteContent = `Website scraping failed or restricted. Proceed with generalized knowledge for a business at URL: ${url}.`;
    }

    // 2. Generate System Prompt using Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const groq = new Groq({ apiKey });

    const promptGeneratorInstruction = `
    You are an expert AI system architect. Build a highly effective System Prompt for an autonomous AI Assistant.
    
    Assistant Name: ${botName || 'Pixi'}
    Role: ${role}
    Source Data extracted from client's website: 
    """
    ${websiteContent}
    """

    Generate a concise, professional system prompt (max 200 words) that instructs the AI on how to act, what its goals are, and the key facts it should know based on the Source Data.
    IMPORTANT: Include instructions to ALWAYS capture the user's Name and Phone Number gently if they show buying intent or ask for support.
    
    Return ONLY the system prompt text. No explanations.
    `;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: promptGeneratorInstruction }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
    });

    const generatedPrompt = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, prompt: generatedPrompt.trim() });

  } catch (error: unknown) {
    console.error("Analysis Error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
