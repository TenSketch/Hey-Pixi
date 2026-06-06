# Local Setup Guide

Get Hey-Pixi running on your machine.

## Prerequisites
- **Node.js** v18.18+ (v20+ recommended for Next.js 16)
- **MongoDB** (local Community Server or Atlas cloud)
- API keys / credentials for the external services below

## 1. Install dependencies

```bash
npm install
```

## 2. Database

### Option A — Local MongoDB
1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start it:
   - Windows: `net start MongoDB`
   - macOS/Linux: `brew services start mongodb-community`
3. URI: `mongodb://127.0.0.1:27017/hey-pixi`

### Option B — MongoDB Atlas
1. Create a free cluster at [Atlas](https://www.mongodb.com/cloud/atlas).
2. Whitelist your IP and create a DB user.
3. Copy the connection string into `MONGODB_URI`.

## 3. Environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

### Required
| Var | Purpose | Where to get it |
| --- | --- | --- |
| `MONGODB_URI` | Database connection | Local or Atlas |
| `AUTH_SECRET` | JWT/session encryption (32+ chars) | `openssl rand -base64 32` |
| `GROQ_API_KEY` | LLM inference (analysis + chat) | [Groq Console](https://console.groq.com/) |
| `JINA_API_KEY` | Website scraping | [Jina AI Reader](https://jina.ai/reader/) |
| `NEXTAUTH_URL` | Base URL for links/redirects | e.g. `http://localhost:3000` |

### Payments (Razorpay) — needed for activation/subscription flows
| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public key (browser checkout) |
| `RAZORPAY_KEY_ID` | Server key id |
| `RAZORPAY_KEY_SECRET` | Server secret (orders + signature verify) |
| `RAZORPAY_PLAN_ID` | Plan id for the Pro subscription |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies incoming webhooks |

### Email (SMTP) — needed for reset/invite/notification emails
| Var | Purpose |
| --- | --- |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server (`587` STARTTLS or `465` TLS) |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials |
| `EMAIL_FROM` | From address (optional) |

> Email and payments are optional for basic local dev. Without SMTP, email functions log a warning and no-op. Reset-password links are also printed to the server console in development.

## 4. Run

```bash
npm run dev        # start the dev server (http://localhost:3000)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
```

## 5. First run checklist
1. Visit `http://localhost:3000` → marketing site.
2. Sign up at `/auth/signup` (password ≥8 chars incl. a digit).
3. Go to `/dashboard/bots/new`, paste a URL (or upload a PDF) and a role → watch the streamed analysis build a system prompt.
4. Save the bot, then (with Razorpay configured) activate it to test the live widget at `/widget/<botId>`.

## 6. Troubleshooting
- **`ECONNREFUSED 127.0.0.1:27017`** — MongoDB isn't running / wrong `MONGODB_URI`.
- **Analysis hangs or errors** — invalid `JINA_API_KEY`, unreachable target site, or SSRF-blocked URL (localhost/private IPs are rejected by design).
- **`GROQ_API_KEY is missing`** — set the key; analysis and chat both require it.
- **OCR is slow on PDFs** — image-based PDFs fall back to `tesseract.js` per page; this is expected to take longer.
- **Emails not arriving** — check SMTP vars; functions warn-and-skip when credentials are absent.
- **Razorpay errors** — ensure key id/secret and (for subscriptions) `RAZORPAY_PLAN_ID` are set.

## Related docs
- [Architecture](./architecture.md)
- [API Reference](./api-reference.md)
- [Groq API](./groq-api.md)
