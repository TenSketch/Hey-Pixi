# Hey-Pixi Architecture

Hey-Pixi is an autonomous AI agent creation platform. A business provides a website URL (or a PDF), and the platform crawls/parses it, distills a structured business profile, and generates a production-ready AI assistant that can hold conversations and autonomously capture leads — all embeddable on any site as a chat widget.

This document is the high-level map. Deep dives live in the linked sub-docs.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion, GSAP
- **Auth:** Auth.js (NextAuth v5 beta) — Credentials + JWT, MongoDB adapter
- **Database:** MongoDB via **Mongoose** (app) and the **native driver** (auth adapter + select writes)
- **LLM Engine:** Groq — `llama-3.1-8b-instant` + `llama-3.3-70b-versatile`
- **Web Scraping:** Jina AI Reader API
- **Document parsing:** `pdf-parse` + `tesseract.js` OCR fallback
- **Payments:** Razorpay (one-time activation + recurring subscription)
- **Email:** Nodemailer over SMTP
- **UI primitives:** Radix UI, lucide-react, recharts, @tanstack/react-table, sonner

## System map

```
Marketing site (/, sections)         Dashboard (/dashboard/*)            Embeddable widget (/widget/[botId])
        │                                   │                                      │
        │                          Auth.js (middleware + RBAC)                     │
        ▼                                   ▼                                      ▼
                         ┌──────────────── API routes / Server Actions ─────────────────┐
                         │  /api/analyze   /api/chat   /api/bots   /api/leads/capture   │
                         │  /api/auth/*    /api/checkout/*   /api/webhook/payment        │
                         └───────────────────────────────────────────────────────────────┘
              │                 │                    │                  │             │
           Groq             Jina/PDF/OCR        MongoDB            Razorpay        SMTP
        (LLM engine)      (knowledge source)   (Mongoose)         (payments)      (email)
```

## Core Workflows

### 1. Agent Creation — the Analysis Pipeline
The most complex part: converting a URL/PDF into a tuned assistant. Streamed to the UI via Server-Sent Events.

1. **Input** — user provides a URL **or** uploads a PDF, plus a `role` and optional `botName`.
2. **Knowledge gathering:**
   - *Website:* Jina Reader fetches the main page and discovers internal links; the system crawls up to 5 high-value sub-pages (about, pricing, services…) while skipping noise (login, dashboard…).
   - *PDF:* `pdf-parse` extracts text; if a page is image-based (little/no text), `tesseract.js` OCR kicks in page by page.
3. **Semantic extraction** — combined knowledge (≤15k chars) → Groq `llama-3.1-8b-instant` returns a structured JSON **Business Profile** (name, tone, services, pricing, facts, audience, rules).
4. **Prompt architecture** — the JSON profile → Groq `llama-3.3-70b-versatile` writes a first-person system prompt.
5. **Result** — streamed back as `{ success, prompt, extraction }`; the user reviews/edits and saves a `BotConfig`.

Detail: [Groq API Integration](./groq-api.md), [API Reference](./api-reference.md).

### 2. Activation
A new bot is `isActive: false`. The owner pays a one-time activation fee via Razorpay; signature verification flips it active. Only active bots serve traffic. Detail: [Payments](./payments.md).

### 3. Chat & Lead Capture
1. The widget loads the bot's `systemPrompt` from MongoDB.
2. A sliding window of the last 10 messages is sent to Groq with brevity/security/button guardrails.
3. The model has a `capture_lead_info` tool; when a user shares name + contact, it's validated and saved via `LeadService`, which emails the bot owner.
4. Token usage is metered against the owner's plan limit. Detail: [Chatbot & Widget](./chatbot.md).

### 4. Workspaces & Teams
Each user owns a workspace; others can be invited as `admin`/`manager`/`viewer`. All agents/leads/payments are scoped to the active workspace owner. Detail: [Workspaces & RBAC](./workspaces-rbac.md).

## Directory layout (`src/`)

```
app/
  api/                 Route handlers (analyze, chat, bots, auth, checkout, webhook, leads)
  auth/                Sign-in / sign-up / forgot- & reset-password pages
  dashboard/           Authenticated app: bots, leads, profile, overview
  widget/[botId]/      Standalone embeddable chat widget
  page.tsx             Marketing landing page
components/            chat/, dashboard/, sections/, layout/, ui/, providers/
lib/
  actions/             Server actions (bot, lead, team, user, workspace)
  services/            chat.service.ts, lead.service.ts
  constants.ts errors.ts rate-limit.ts mail.ts workspace.ts utils.ts
  mongodb.ts mongodb-client.ts
models/                User, BotConfig, Lead, Payment, ProjectInvite
auth.ts auth.config.ts middleware.ts
```

## Cross-cutting concerns
- **Security** — hardened headers, RBAC, rate limiting, SSRF blocking, payment-signature verification, LLM XSS/injection defenses. See [Security](./security.md).
- **Database** — two connection layers (Mongoose + native). See [Database Models](./database-models.md).
- **Email** — transactional notifications. See [Email](./email.md).

## Documentation index
- [Setup Guide](./setup.md)
- [Groq API Integration](./groq-api.md)
- [Chatbot & Widget](./chatbot.md)
- [API Reference](./api-reference.md)
- [Authentication](./authentication.md)
- [Workspaces & RBAC](./workspaces-rbac.md)
- [Payments](./payments.md)
- [Email](./email.md)
- [Database Models](./database-models.md)
- [Security](./security.md)
