# API Routes

This document outlines the primary API routes used in Hey-Pixi.

## `POST /api/analyze`
Analyzes a given URL and generates a production-ready system prompt for an AI agent.

- **Payload**:
  ```json
  {
    "url": "https://example.com",
    "role": "customer support",
    "botName": "Support Bot"
  }
  ```
- **Response**: Server-Sent Events (SSE) stream.
- **Stream Format**:
  - Progress updates: `data: {"status": "Fetching deeper context (1/4)..."}`
  - Completion: `data: {"success": true, "prompt": "You are Support Bot...", "extraction": {...}}`
- **Logic**:
  1. Validates rate limits and SSRF rules.
  2. Uses Jina AI to fetch the main page and extract internal links.
  3. Fetches up to 5 sub-pages in parallel.
  4. Uses Groq to extract semantic JSON data from the raw markdown.
  5. Uses Groq to generate the final prompt based on the JSON.

## `POST /api/chat` (Internal Service)
Handles conversational turns between the user and the bot.

- **Logic** (`src/lib/services/chat.service.ts`):
  1. Fetches the bot's configuration (system prompt) from MongoDB.
  2. Constructs a message array with a sliding window (last 10 messages) to maintain context.
  3. Appends a specialized tool (`capture_lead_info`) to the Groq request.
  4. If the LLM determines it has enough info, it triggers the tool. The backend validates the email/phone and saves it to the database via `LeadService`.
  5. Returns the text response to the user.
