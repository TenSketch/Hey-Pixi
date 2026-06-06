# Security

A consolidated view of the defensive measures across Hey-Pixi.

---

## 1. Security headers (`src/middleware.ts`)

Every non-static response carries a hardened header set:

- **Content-Security-Policy** — restricts script/style/img/font/connect/frame sources. Allow-lists Razorpay and Google Fonts only.
- **Strict-Transport-Security** — `max-age=31536000; includeSubDomains; preload`.
- **X-Content-Type-Options** — `nosniff`.
- **Referrer-Policy** — `strict-origin-when-cross-origin`.
- **Permissions-Policy** — disables camera, microphone, geolocation, FLoC.
- **X-Frame-Options** — `DENY` for the app.

### Widget framing exception
For `/widget/*` routes the policy is intentionally relaxed so the chat widget can be embedded on any customer site:
- `frame-ancestors *` instead of `'none'`.
- `X-Frame-Options` header is **deleted** (DENY would block all embedding).

---

## 2. Authentication & sessions
- Passwords hashed with `bcryptjs` (cost 10).
- JWT sessions via NextAuth v5.
- Password-reset tokens are 32-byte random, single-use, 15-min expiry.
- Forgot-password is **anti-enumeration** (uniform response).

See [Authentication](./authentication.md).

---

## 3. Authorization (RBAC + ownership)
- Every mutating route/action resolves the effective workspace role server-side and blocks viewers (`403`).
- Agent deletion is admin-only; team management is owner-only.
- All bot/lead/payment queries are scoped to the resolved `ownerId` — no cross-workspace access.
- `botId`/`leadId`/`memberId` are validated as real ObjectIds before any query (prevents CastError → 500 and ID probing).

See [Workspaces & RBAC](./workspaces-rbac.md).

---

## 4. Rate limiting (`src/lib/rate-limit.ts`)

An in-memory LRU token bucket keyed by IP or session.

| Endpoint | Limit |
| --- | --- |
| `/api/analyze` | 3 / min / IP |
| `/api/chat` | 10 / min / identity |
| `/api/auth/register` | 5 / hour / IP |
| `/api/auth/forgot-password` | 3 / hour / IP |

> In-memory limiting is per-instance. For multi-instance/serverless scale, back this with a shared store (e.g. Redis/Upstash).

---

## 5. SSRF protection (`src/lib/constants.ts`)

`isSSRFTarget(url)` + `SSRF_BLOCKED_PATTERNS` block requests to localhost, private ranges (`10.`, `192.168.`, `172.16–31.`), link-local, IPv6 loopback, and cloud metadata endpoints (AWS `169.254.`, GCP `metadata.google`, Alibaba). This guards the analysis crawler from being pointed at internal infrastructure.

---

## 6. Payment integrity
- Order amounts come from server constants, never the client.
- Activation payments verified via HMAC-SHA256 signature server-side.
- Webhooks verified via `RAZORPAY_WEBHOOK_SECRET`.
- `razorpayPaymentId` is unique → replay attacks return `409`.

See [Payments](./payments.md).

---

## 7. LLM-specific defenses
- **XSS** — bot Markdown rendered with `rehype-sanitize`.
- **Prompt injection** — a security guardrail appended to every system prompt makes the bot refuse "ignore instructions"/"reveal prompt" requests.
- **Tool abuse** — placeholder/dummy lead values rejected; leaked function-call syntax stripped from user-facing text.
- **Token/cost abuse** — message length, history length, and combined-knowledge size all capped; per-account token limits enforced.

See [Groq API](./groq-api.md) and [Chatbot](./chatbot.md).

---

## 8. Input validation
- Centralized regex/limits in `src/lib/constants.ts` (`VALIDATION`, `LIMITS`).
- Email/phone validated before lead persistence; phone normalized to 10 digits.
- System prompt ≤4000 chars; chat message ≤2000 chars; max 10 bots/workspace.

---

## 9. Secrets handling
- All third-party keys (Groq, Jina, Razorpay secret, SMTP) are server-side only.
- Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed to the browser (by design, for checkout).

---

## Related docs
- [Authentication](./authentication.md)
- [Payments](./payments.md)
- [Workspaces & RBAC](./workspaces-rbac.md)
- [Groq API](./groq-api.md)
