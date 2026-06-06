# API Reference

Complete reference for Hey-Pixi's backend endpoints (Next.js App Router route handlers under `src/app/api`) and the server actions used by the dashboard.

Conventions:
- All responses are JSON unless noted (`/api/analyze` is SSE).
- Auth means a valid NextAuth session cookie is required.
- RBAC is enforced via the active-workspace role; viewers are blocked from mutations.

---

## Authentication

### `POST /api/auth/register`
Create a new account.
- **Rate limit:** 5/hour per IP.
- **Body:** `{ name, email, password }`
- **Rules:** name 1–100 chars; valid email; password ≥8 chars and contains a digit; email must be unique.
- **200:** `{ success: true, userId }`
- **Errors:** `400` validation / duplicate email, `429` rate limit.

### `GET|POST /api/auth/[...nextauth]`
NextAuth handler (sign-in, sign-out, session, callbacks). Credentials provider only.

### `POST /api/auth/forgot-password`
Request a password-reset link.
- **Rate limit:** 3/hour per IP.
- **Body:** `{ email }`
- **Behavior:** always returns generic success (anti-enumeration). If the user exists, stores a 32-byte token (15-min expiry) and emails a reset link.
- **200:** `{ success: true, message }`

### `POST /api/auth/reset-password`
Complete a password reset.
- **Body:** `{ token, password }`
- **Rules:** password ≥8 chars + digit; token must match and be unexpired.
- **200:** `{ success: true }` (token cleared, single-use)
- **Errors:** `400` invalid/expired token or weak password.

---

## Analysis Engine

### `POST /api/analyze` — **SSE stream**
Scrapes a website **or** parses a PDF, then generates a system prompt with Groq.
- **Auth required.** **RBAC:** viewers blocked.
- **Rate limit:** 3/min per IP.
- **Body (one of):**
  - Website: `{ url, role, botName? }`
  - PDF: `{ pdfBase64, fileName?, role, botName? }`
- **Response:** `text/event-stream`. Each event is `data: {json}`:
  - `{ status: "..." }` — progress updates (reading, OCR page x/y, analyzing, generating).
  - `{ error: "..." }` — failure; stream closes.
  - `{ success: true, prompt, extraction }` — final result.
- **Pipeline:** Jina Reader (multi-page crawl, ≤5 sub-pages) **or** `pdf-parse` with a `tesseract.js` OCR fallback for image PDFs → Groq extraction (`llama-3.1-8b-instant`, JSON) → Groq architect (`llama-3.3-70b-versatile`). Knowledge truncated to ~15k chars. See [Groq API](./groq-api.md).

---

## Chat

### `POST /api/chat`
Generate a bot reply (and possibly capture a lead).
- **Rate limit:** 10/min per identity (session email, else IP).
- **Body:** `{ message, botId, history?: {text,sender}[] }`
- **Rules:** message required, ≤2000 chars; history sanitized & capped.
- **200:** `{ result: "<bot reply text>" }`
- **Errors:** `400` bad input, `404` bot not found, `429` rate limit, `500`.
- Delegates to `ChatService`. See [Chatbot](./chatbot.md).

---

## Bots

### `POST /api/bots`
Create an agent (`isActive: false`).
- **Auth.** **RBAC:** viewers blocked. Auto-creates the `User` if missing.
- **Body:** `{ name, role, url?, systemPrompt }`
- **Rules:** required fields; `systemPrompt` ≤4000 chars; max 10 bots/workspace.
- **200:** `{ success: true, botId }`

### `GET /api/bots/[id]`
Fetch a single bot (scoped to the active workspace).
- **200:** `{ bot, userRole }`
- **Errors:** `400` bad id, `404` not found.

### `PATCH /api/bots/[id]`
Update `systemPrompt` / `name` / `role`.
- **RBAC:** viewers blocked. `systemPrompt` ≤4000 chars.
- **200:** `{ bot, success: true }`

### `DELETE /api/bots/[id]`
Delete a bot **and cascade** its leads + payments.
- **RBAC:** **admin only.**
- **200:** `{ success: true }`

---

## Leads

### `POST /api/leads/capture`
Public, form-based lead capture (used by the widget's button overlay).
- **No auth** (called from the embedded widget).
- **Body:** `{ botId, name, email?, phone?, selectedService?, lastMessage? }`
- **Rules:** `botId` + `name` required; valid `botId`.
- **200:** `{ success: true, leadId }`

---

## Payments (Razorpay)

### `POST /api/checkout/razorpay`
Create a one-time **bot activation** order (₹1999).
- **Auth + RBAC** (viewers blocked). Bot must exist, be owned, and be inactive.
- **200:** `{ success: true, order }`

### `POST /api/checkout/razorpay/verify`
Verify an activation payment and activate the bot.
- Verifies HMAC signature; re-checks ownership/RBAC.
- **200:** `{ success: true }`
- **Errors:** `400` signature fail, `409` duplicate payment.

### `POST /api/checkout/subscription`
Create a recurring **Pro** subscription.
- **Auth + RBAC.** Requires `RAZORPAY_PLAN_ID`.
- **200:** `{ success: true, subscriptionId, keyId }`

### `POST /api/webhook/payment`
Razorpay webhook (server-to-server). Verifies `x-razorpay-signature`.
- Handles `subscription.charged` (upgrade), `subscription.cancelled` / `expired` (downgrade), `subscription.halted` (`past_due`).
- **200:** `{ status: "ok" }`

See [Payments](./payments.md).

---

## Server Actions (dashboard)

These are Next.js `"use server"` functions, not HTTP endpoints — invoked directly from React Server/Client components. All enforce auth + RBAC + workspace scoping.

| File | Function | Purpose |
| --- | --- | --- |
| `lib/actions/bot-actions.ts` | `createBot`, `updateBotSettings`, `deleteBot` | Agent CRUD (mirrors `/api/bots`). |
| `lib/actions/lead-actions.ts` | `updateLeadStatus` | Move a lead through the CRM pipeline (viewers blocked). |
| `lib/actions/team-actions.ts` | `inviteTeamMember`, `removeTeamMember`, `revokeInvite`, `getTeamData` | Workspace team management (owner/admin only). |
| `lib/actions/user-actions.ts` | `updateUserRole`, `simulateUsage` | Self role change; usage simulation (dev/testing of limits + emails). |
| `lib/actions/workspace-actions.ts` | `switchWorkspace`, `getActiveWorkspaceCookie` | Toggle the active workspace cookie. |

---

## Standard error codes

| Code | Meaning |
| --- | --- |
| `400` | Missing/invalid parameters or invalid ObjectId. |
| `401` | Not authenticated. |
| `403` | Authenticated but lacks role (RBAC). |
| `404` | Resource not found / not owned. |
| `409` | Conflict (duplicate payment). |
| `429` | Rate limit exceeded. |
| `500` | Internal/pipeline error. |

`AppError` subclasses in `src/lib/errors.ts` (`Unauthorized`, `NotFound`, `BadRequest`, `RateLimit`) carry their own `statusCode` and are mapped to HTTP responses.

---

## Related docs
- [Groq API Integration](./groq-api.md)
- [Chatbot & Widget](./chatbot.md)
- [Payments](./payments.md)
- [Authentication](./authentication.md)
