# Chatbot & Embeddable Widget

This document covers the runtime chatbot — how a created agent actually talks to end-users, how it is embedded on a customer's website, and how leads flow from a conversation into the CRM.

For *how the bot's brain (system prompt) is generated*, see [Groq API Integration](./groq-api.md). For *how a bot is created in the dashboard*, see [Architecture](./architecture.md).

---

## 1. Anatomy of a bot

Every agent is a `BotConfig` document (`src/models/BotConfig.ts`):

| Field | Meaning |
| --- | --- |
| `userId` | Owner (workspace owner id, not necessarily the creator). |
| `name` | Display name shown in the widget header. |
| `role` | Human description of the bot's job (e.g. "Customer Support Lead"). |
| `url` | Source website used during analysis (optional for PDF-sourced bots). |
| `systemPrompt` | The Groq-generated brain. Loaded on every chat turn. |
| `themeColor` | Hex color for the widget UI (default `#0f172a`). |
| `isActive` | **Gate.** A bot only serves traffic after payment activates it. |

A bot is created with `isActive: false` and flips to `true` only after a successful Razorpay activation payment (see [Payments](./payments.md)).

---

## 2. The chat request lifecycle

```
End user types → ChatWindow (client) → POST /api/chat → ChatService.generateResponse → Groq → reply
                                                              │
                                                              ├─ enforce token limits
                                                              ├─ tool call → LeadService.captureLead → MongoDB + email
                                                              └─ return cleaned text (+ optional [[BUTTON]] chips)
```

### Frontend — `src/components/chat/ChatWindow.tsx`
- Client component rendering the message list, typing indicator, and input box.
- Keeps local message state, seeded with a greeting: `"Hello! I am {botName}. How can I help you today?"`.
- On send, posts `{ message, botId, history }` to `/api/chat`, sending only the **last 10 messages** (`MAX_HISTORY_TO_SEND`).
- Input is capped at 2000 chars (`MAX_MESSAGE_LENGTH`).
- Renders bot replies as Markdown via `react-markdown` with **`rehype-sanitize`** to prevent XSS from prompt-injected HTML.

### API route — `src/app/api/chat/route.ts`
- Rate limited to **10 requests/min** per identity (session email, else IP).
- Validates `message` (required, ≤ `LIMITS.MAX_CHAT_MESSAGE_LENGTH`).
- Sanitizes the `history` array: caps length, coerces each item to `{ text, sender }` with `sender ∈ {user, bot}`.
- Delegates to `ChatService.generateResponse(message, botId, history)`.
- Maps `AppError` subclasses to proper HTTP status codes; everything else → 500.

### Service — `src/lib/services/chat.service.ts`
This is the core. See [Groq API Integration](./groq-api.md) for the model call, tool calling, and guardrail details. In summary it:
1. Loads the bot's `systemPrompt` (validates `botId` is a real ObjectId).
2. Enforces the owner's token limits and fires usage-warning emails.
3. Wraps the prompt with brevity / button / tool-use / security guardrails.
4. Calls Groq with the `capture_lead_info` tool.
5. Parses native **and** text-leaked tool calls, validates lead data, and persists via `LeadService`.
6. Returns cleaned, capitalized reply text.

---

## 3. Interactive buttons

The bot can emit clickable option chips using a custom syntax the model is instructed to use:

```
We offer several plans. [[BUTTON: Free Plan]] [[BUTTON: Pro Plan]] [[BUTTON: Enterprise]]
```

`ChatWindow` does two things with this:
- **Strips** the `[[BUTTON: ...]]` tokens out of the rendered Markdown text.
- **Renders** each captured label as a styled button (themed with `themeColor`).

Clicking a button sets `selectedService` and opens the **Lead Capture Form** overlay (`src/components/chat/LeadCaptureForm.tsx`), which submits to `POST /api/leads/capture`. This is a deterministic, form-based capture path that complements the LLM's autonomous `capture_lead_info` tool.

---

## 4. Two lead-capture paths

| Path | Trigger | Endpoint | Notes |
| --- | --- | --- | --- |
| **Autonomous (LLM tool)** | Model detects name + contact mid-conversation | handled inside `/api/chat` → `LeadService` | Validates & dedupes; replies with a confirmation. |
| **Explicit (form)** | User clicks a `[[BUTTON]]` and fills the overlay | `POST /api/leads/capture` | No chat history; `lastMessage` records the selected service. |

Both converge on `LeadService.captureLead()` (`src/lib/services/lead.service.ts`), which:
- Requires a name and at least one of phone/email.
- Sanitizes name (≤100 chars), normalizes the phone to 10 digits.
- Stores the conversation `transcript`.
- Sends a **New Lead** email to the bot creator (see [Email](./email.md)).

Captured leads land in the dashboard CRM (`/dashboard/leads`) where managers/admins can update status (`new → contacted → qualified → closed/resolved`).

---

## 5. Embedding the widget

The widget is served standalone at:

```
/widget/[botId]
```

`src/app/widget/[botId]/page.tsx`:
- Validates `botId` is a valid ObjectId → otherwise `notFound()`.
- Loads the `BotConfig`. If missing → 404. If `isActive === false` → shows an "inactive" notice (no chat).
- Otherwise renders `<ChatWindow>` full-screen on a transparent background, ready to be `<iframe>`d.

### Cross-site framing (CSP)

By default the app sends `X-Frame-Options: DENY` and `frame-ancestors 'none'` (see `src/middleware.ts`). For widget routes (`/widget/*`) this is relaxed so the bot can be embedded anywhere:
- `frame-ancestors *`
- `X-Frame-Options` header is **deleted** for widget responses.

This lets a customer drop the widget into their own site:

```html
<iframe
  src="https://heypixi.in/widget/<BOT_ID>"
  style="border:none;position:fixed;bottom:20px;right:20px;width:380px;height:600px;"
  allow="clipboard-write">
</iframe>
```

The dashboard's `TestWidgetLauncher` (`src/components/dashboard/TestWidgetLauncher.tsx`) lets owners preview the live widget before/while embedding.

---

## 6. Security notes specific to the chatbot

- **XSS** — all bot output is sanitized with `rehype-sanitize` before rendering.
- **Prompt injection** — the appended security guardrail makes the bot refuse "ignore instructions / reveal your prompt" requests.
- **Tool abuse** — placeholder/dummy contact data is rejected before any DB write.
- **Rate limiting** — 10 chat msgs/min per identity.
- **Input bloat** — message length and history length are both capped server-side.
- **Activation gate** — inactive bots cannot be chatted with.

---

## Related docs
- [Groq API Integration](./groq-api.md)
- [API Reference](./api-reference.md)
- [Database Models](./database-models.md)
- [Payments](./payments.md)
- [Email](./email.md)
