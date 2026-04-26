import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import Groq from "groq-sdk";

const limiter = rateLimit({
    interval: 60 * 1000, 
    uniqueTokenPerInterval: 200, 
});

const JINA_API_URL = "https://r.jina.ai/";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Fetches content from a URL using Jina Reader
 */
async function fetchWithJina(url: string) {
    const apiKey = process.env.JINA_API_KEY;
    const response = await fetch(`${JINA_API_URL}${url}`, {
        headers: {
            "Accept": "application/json",
            ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
            "X-With-Links-Summary": "true", // Tell Jina to include links
        },
    });

    if (!response.ok) {
        throw new Error(`Jina fetch failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Extracts relevant internal links from the Jina response
 */
function extractInternalLinks(linksObj: Record<string, string> | undefined, baseUrl: string): string[] {
    if (!linksObj) return [];
    
    const links: string[] = [];
    const urlObj = new URL(baseUrl);
    const domain = urlObj.hostname;
    const origin = urlObj.origin;

    // Normalize baseUrl by removing trailing slash
    const normalizedBase = baseUrl.replace(/\/$/, "");

    const priorities = ["about", "pricing", "service", "feature", "product", "contact", "docs", "solution", "plan"];
    const noise = ["login", "signup", "onboarding", "auth", "logout", "signin", "register", "dashboard", "app"];
    const fallbackLinks: string[] = [];
    
    for (const linkUrlRaw of Object.values(linksObj)) {
        let linkUrl = linkUrlRaw.trim();
        
        // 1. Ignore anchors and empty links
        if (linkUrl.includes("#") || !linkUrl) continue;

        // 2. Handle relative URLs
        if (linkUrl.startsWith("/")) {
            linkUrl = `${origin}${linkUrl}`;
        }

        try {
            const linkObj = new URL(linkUrl);
            const normalizedLink = linkUrl.replace(/\/$/, "");
            const path = linkObj.pathname.toLowerCase();

            // 3. Ensure it's the same domain and not the homepage/self
            if (linkObj.hostname === domain && !links.includes(normalizedLink) && normalizedLink !== normalizedBase) {
                
                // 4. Skip "noise" pages (auth, app shell, etc.)
                if (noise.some(n => path.includes(n))) continue;

                // 5. Prioritize "knowledge" pages
                if (priorities.some(p => path.includes(p))) {
                    links.push(normalizedLink);
                } else {
                    fallbackLinks.push(normalizedLink);
                }
            }
        } catch (e) {
            // Ignore invalid URLs
        }
    }

    // Combine and return top 5 unique content-rich pages
    const finalLinks = [...links, ...fallbackLinks];
    return Array.from(new Set(finalLinks)).slice(0, 5);
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      
      const sendError = (msg: string) => {
        sendEvent({ error: msg });
        controller.close();
      };

      try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { isRateLimited } = limiter.check(3, ip); 

        if (isRateLimited) {
            return sendError("Rate limit exceeded. Highly intensive analysis is limited to 3 per minute.");
        }

        const { url, role, botName } = await req.json();

        if (!url || !role) {
          return sendError("Missing url or role");
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return sendError("GROQ_API_KEY is missing");
        }
        const groq = new Groq({ apiKey });

        // 1. Fetch Main Page
        sendEvent({ status: `Reading ${url}...` });
        const mainPageData = await fetchWithJina(url);
        const mainContent = mainPageData.data?.content || "";
        
        // 2. Multi-Page Discovery
        const subLinks = extractInternalLinks(mainPageData.data?.links, url);
        
        let combinedKnowledge = `Main Page (${url}):\n${mainContent}\n\n`;

        // 3. Sequential or Parallel Fetching with Progress
        if (subLinks.length > 0) {
            for (let i = 0; i < subLinks.length; i++) {
                const link = subLinks[i];
                sendEvent({ status: `Fetching deeper context (${i + 1}/${subLinks.length})...` });
                try {
                    const result = await fetchWithJina(link);
                    combinedKnowledge += `Sub-page (${link}):\n${result.data?.content || ""}\n\n`;
                } catch (e) {
                    console.warn(`Failed to fetch ${link}`);
                }
            }
        }

        // Limit total knowledge size to ~15k chars
        const truncatedKnowledge = combinedKnowledge.substring(0, 15000);

        // 4. STEP 1: Semantic Extraction
        sendEvent({ status: `Analyzing business model...` });
        const extractionPrompt = `
        You are a high-precision data extractor. Analyze the provided website content and extract a structured Business Profile.
        
        CONTENT:
        """
        ${truncatedKnowledge}
        """
        
        Return a JSON object with the following fields:
        {
          "businessName": "Name of the business",
          "tone": "Description of the brand voice (e.g., professional, witty, empathetic)",
          "coreServices": ["List of main products or services"],
          "pricing": "Summary of pricing or 'Contact for pricing' if not found",
          "keyFacts": ["Key selling points or important company info"],
          "targetAudience": "Who are they talking to?",
          "rules": ["Any specific constraints or guidelines found (e.g., 'no refunds', 'free shipping over $50')"]
        }
        
        Return ONLY valid JSON.
        `;

        const extractionResponse = await groq.chat.completions.create({
            messages: [{ role: "system", content: extractionPrompt }],
            model: GROQ_MODEL,
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const businessProfile = JSON.parse(extractionResponse.choices[0]?.message?.content || "{}");

        // 5. STEP 2: Final System Prompt Generation
        sendEvent({ status: `Generating optimized prompt...` });
        const sanitizedBotName = (botName || businessProfile.businessName || 'Pixi').substring(0, 50);
        const sanitizedRole = role.substring(0, 100);

        const architectPrompt = `
        You are an expert AI Prompt Architect. Create a production-ready System Prompt for an autonomous AI Assistant.
        
        ASSISTANT CONFIG:
        - Name: ${sanitizedBotName}
        - Role: ${sanitizedRole}
        
        BUSINESS PROFILE (JSON):
        ${JSON.stringify(businessProfile, null, 2)}
        
        The generated prompt must be written in the FIRST PERSON for the assistant (e.g., "You are ${sanitizedBotName}...") and include:
        1. Identity & Mission: Based on the role and business tone.
        2. Knowledge Base: Derived from the extracted core services, pricing, and facts.
        3. Operational Guidelines: 
           - Concise, conversational responses (chat-widget style).
           - Handling unknown info (never hallucinate).
           - LEAD CAPTURE: Gently ask for Name and Phone/Email when interest is shown.
        4. Tone: Adhering to the extracted brand voice.
        
        Return ONLY the final system prompt text.
        `;

        const finalCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: architectPrompt }],
            model: GROQ_MODEL,
            temperature: 0.3,
        });

        const generatedPrompt = finalCompletion.choices[0]?.message?.content || "";

        // Final completion event
        sendEvent({ 
            success: true, 
            prompt: generatedPrompt.trim(),
            extraction: businessProfile 
        });
        
        controller.close();

      } catch (error: unknown) {
        console.error("Analysis Error:", error);
        const message = error instanceof Error ? error.message : "Failed to analyze URL";
        sendError(message);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

