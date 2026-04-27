# Hey-Pixi API Documentation

Welcome to the Hey-Pixi API documentation. This document provides a comprehensive overview of the backend services, their logic, and the core engine that powers our intelligent AI agent creation.

---

## 🚀 Core Endpoints

### 1. `POST /api/analyze` (The Discovery Engine)
This endpoint is responsible for scraping a website, understanding its business context, and generating a highly specialized AI system prompt.

- **Request Body**:
  ```json
  {
    "url": "https://yourbusiness.com",
    "role": "Customer Support Lead",
    "botName": "Pixi"
  }
  ```
- **Response**: `text/event-stream` (Server-Sent Events)
- **SSE Events**:
  - `status`: Progress updates (e.g., "Reading your-url...", "Analyzing business model...")
  - `error`: Error messages if the process fails.
  - `success`: The final payload containing:
    - `prompt`: The generated system prompt.
    - `extraction`: A structured JSON of the business profile.

---

### 2. `POST /api/chat` (The Intelligence Service)
Handles real-time conversation between users and the AI bot. This service is designed to be lean, fast, and secure.

- **Logic**:
  1. **Configuration Retrieval**: Fetches the bot's custom system prompt from MongoDB based on `botId`.
  2. **Prompt Hardening**: Appends strict guardrails (brevity, security, tool usage instructions) to ensure consistent behavior.
  3. **Context Management**: Implements a **Sliding Window** (last 10 messages) to maintain conversational context without exceeding token limits.
  4. **Lead Capture Tooling**: Automatically injects the `capture_lead_info` tool. If the LLM identifies a lead (name + contact info), it triggers a database write via `LeadService`.
  5. **Validation**: All captured data is validated against regex patterns before being persisted.

---

## 🧠 The Analysis Engine: Deep Dive

The "Analysis Engine" is the heart of Hey-Pixi. Here is a breakdown of how it works and why it’s designed this way.

### 1. How it works (The Pipeline)
1. **Source Extraction**: We use **Jina Reader** to convert the provided URL into a clean, markdown-formatted text.
2. **Context Discovery**: Our algorithm scans the extracted links to find high-value pages (e.g., `/pricing`, `/about`, `/services`) while ignoring low-value "noise" (e.g., `/login`, `/dashboard`).
3. **Multi-Page Synthesis**: We crawl up to 5 additional sub-pages in parallel to build a holistic "Knowledge Base" for the business.
4. **Semantic JSON Distillation**: Using **Llama-3.3-70B**, we compress thousands of words of raw text into a structured JSON profile containing:
   - Business Name & Tone
   - Core Services & Pricing
   - Key Facts & Target Audience
   - Operational Rules
5. **Prompt Architecture**: A specialized "Prompt Architect" agent uses the JSON profile to draft a production-ready system prompt, ensuring the bot knows *exactly* who it is and how to behave.

### 2. What it is doing
It is transforming **unstructured web data** into a **structured identity**. Instead of just "reading" a page, it's "interviewing" the website to understand the brand's DNA.

### 3. Why it works this way
- **Efficiency**: Fetching only 5 sub-pages balances deep context with fast execution.
- **Accuracy**: By first extracting JSON and *then* generating the prompt, we reduce hallucinations. The LLM focuses on one task at a time: "What are the facts?" then "How should I speak?".
- **Scalability**: The modular pipeline allows us to swap models or data sources easily as the platform grows.

---

## 🛡️ Security & Rate Limiting

- **SSRF Protection**: All URLs are validated to prevent Server-Side Request Forgery.
- **Rate Limits**: The `/api/analyze` endpoint is limited to **3 requests per minute per IP** to prevent abuse of the high-compute scraping and AI pipelines.
- **Data Privacy**: No scraped content is permanently stored; only the distilled prompt and bot configuration are persisted in your private database.

---

## 🛠️ Error Handling

The API uses standard HTTP status codes:
- `400 Bad Request`: Missing parameters or invalid URL.
- `429 Too Many Requests`: Rate limit exceeded.
- `404 Not Found`: Bot ID not found in database.
- `500 Internal Server Error`: Pipeline failure (e.g., Jina or Groq downtime).
