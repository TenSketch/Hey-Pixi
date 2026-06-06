# Hey-Pixi

Hey-Pixi is an autonomous AI agent creation platform. Businesses generate highly-tuned customer-support and sales bots by simply providing a **website URL** (or a **PDF**). The platform crawls/parses the source, distills a structured business profile with Groq, and produces an intelligent agent that holds conversations and captures leads autonomously — embeddable on any site as a chat widget.

## 🚀 Features

- **Instant agent creation** — provide a URL and the system crawls high-value sub-pages (About, Pricing, Services) via Jina AI to build a knowledge base. PDFs are supported too, with OCR fallback for scanned documents.
- **Two-step prompt architecture** — Groq (`llama-3.1-8b-instant` for extraction, `llama-3.3-70b-versatile` for the system prompt) turns raw content into a tuned, first-person agent brain.
- **Real-time streaming** — live progress during scraping/analysis via Server-Sent Events.
- **Autonomous lead capture** — agents use a `capture_lead_info` tool to detect contact details mid-conversation, validate them, save to the CRM, and email the owner.
- **Embeddable widget** — drop a single `<iframe>` (`/widget/[botId]`) into any website; cross-site framing is handled via a relaxed CSP.
- **Accounts & teams** — email/password auth (NextAuth v5), password reset, and shared **workspaces** with `admin`/`manager`/`viewer` RBAC.
- **Monetization** — Razorpay one-time bot activation and recurring Pro subscriptions, with per-account message-token limits and usage-warning emails.
- **Modern stack** — Next.js 16 App Router, React 19, Tailwind v4, MongoDB.

## 📚 Documentation

Full documentation lives in [`docs/`](./docs):

| Doc | What's inside |
| --- | --- |
| [Architecture](./docs/architecture.md) | High-level system map and workflows |
| [Setup Guide](./docs/setup.md) | Local install, env vars, troubleshooting |
| [Analysis Engine](./docs/analyze.md) | URL/PDF → system prompt pipeline |
| [Groq API Integration](./docs/groq-api.md) | Models, tool calling, guardrails |
| [Chatbot & Widget](./docs/chatbot.md) | Runtime chat, buttons, embedding |
| [API Reference](./docs/api-reference.md) | All endpoints + server actions |
| [Authentication](./docs/authentication.md) | Auth.js, sessions, password reset |
| [Workspaces & RBAC](./docs/workspaces-rbac.md) | Teams, roles, multi-tenancy |
| [Payments](./docs/payments.md) | Razorpay activation + subscriptions |
| [Email](./docs/email.md) | Transactional email templates |
| [Database Models](./docs/database-models.md) | Mongoose schemas |
| [Security](./docs/security.md) | Headers, rate limits, SSRF, LLM defenses |

## 🛠️ Quick Start

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, AUTH_SECRET, GROQ_API_KEY, JINA_API_KEY (+ Razorpay/SMTP as needed)
npm run dev                  # http://localhost:3000
```

Ensure MongoDB is running (`net start MongoDB` on Windows, or a valid Atlas URI). See the [Setup Guide](./docs/setup.md) for the full list of environment variables.

## 📄 License

MIT — see [LICENSE](./LICENSE).
