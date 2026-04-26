# Hey-Pixi Architecture

Hey-Pixi is an autonomous AI agent creation platform designed to help businesses quickly spin up customer support and sales bots by simply providing a website URL.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes (Edge & Serverless)
- **Database**: MongoDB (via Mongoose)
- **LLM Engine**: Groq (Llama-3.3-70b-versatile)
- **Web Scraping**: Jina AI Reader API
- **Integrations**: Gupshup (WhatsApp), Razorpay (Payments)

## Core Workflows

### 1. Agent Creation (The Analysis Pipeline)
The most complex part of Hey-Pixi is how it converts a URL into a highly-tuned AI assistant.

1. **User Input**: User provides a target URL (e.g., `https://flowcept.in/`).
2. **Jina Discovery**: The backend calls Jina Reader to fetch the main page and extract internal links.
3. **Multi-Page Crawling**: The system identifies priority pages (About, Pricing, Docs, Services) and fetches them in parallel.
4. **Semantic Extraction**: The raw markdown from all pages is sent to Groq. Groq is instructed to extract a structured `Business Profile` (JSON) containing the business name, tone, core services, and pricing.
5. **Prompt Architecture**: A secondary Groq call uses the JSON profile to write a highly-optimized, first-person system prompt for the agent.
6. **Streaming**: Throughout this process, the backend streams progress back to the frontend using Server-Sent Events (SSE).

### 2. Chat & Lead Capture
When a user interacts with a Hey-Pixi bot:

1. **Context Loading**: The bot's specific `systemPrompt` is loaded from MongoDB.
2. **Conversation Window**: The last 10 messages are passed to the Groq API to maintain context without exceeding token limits.
3. **Tool Calling**: The LLM is equipped with a `capture_lead_info` tool. If the user provides a name and phone/email, the LLM autonomously triggers this tool.
4. **Data Persistence**: When the tool is called, the backend validates the data using regex (email/phone) and saves the lead to MongoDB via `LeadService`.

## Security & Rate Limiting
- **Rate Limiting**: Custom implementation using an in-memory token bucket to prevent abuse (e.g., maximum 3 analysis requests per minute per IP).
- **SSRF Protection**: URL targets are validated against an internal blocklist to prevent Server-Side Request Forgery attacks.
- **API Keys**: All sensitive integrations (Groq, Jina, Gupshup) are strictly handled server-side.
