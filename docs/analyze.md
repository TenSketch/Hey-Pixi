# The Analysis Engine — Deep Dive

> For the full request/response contract see [API Reference → /api/analyze](./api-reference.md#analysis-engine). For the LLM specifics see [Groq API](./groq-api.md). This document focuses on **how the engine turns raw input into a system prompt and why it's built this way.**

The Analysis Engine (`src/app/api/analyze/route.ts`) is the heart of Hey-Pixi. It accepts a **website URL** or a **PDF**, builds a knowledge base, and produces a production-ready AI system prompt — streaming progress to the UI the whole time.

---

## 1. Two input modes

| Mode | Trigger | Source extraction |
| --- | --- | --- |
| **Website** | `{ url, role, botName? }` | Jina Reader + multi-page crawl |
| **PDF** | `{ pdfBase64, fileName?, role, botName? }` | `pdf-parse` text, with `tesseract.js` OCR fallback |

Both modes converge on the same two-step Groq prompting pipeline.

---

## 2. Website pipeline (Jina Reader)

1. **Source extraction** — `fetchWithJina(url)` calls `https://r.jina.ai/<url>` with `X-With-Links-Summary: true`, returning clean markdown **and** a links map.
2. **Context discovery** — `extractInternalLinks()` scans the links:
   - keeps **same-domain** links only,
   - drops anchors and the homepage itself,
   - **skips noise**: `login`, `signup`, `auth`, `dashboard`, `app`, …,
   - **prioritizes knowledge**: `about`, `pricing`, `service`, `feature`, `product`, `contact`, `docs`, `solution`, `plan`,
   - returns up to **5** unique pages (priority pages first, then fallbacks).
3. **Multi-page synthesis** — each sub-page is fetched (with progress events) and concatenated into one knowledge blob. Failures on individual pages are logged and skipped, not fatal.

---

## 3. PDF pipeline (text + OCR)

1. `pdf-parse` extracts embedded text.
2. **OCR fallback** — if the extracted text is suspiciously short (< 100 chars, i.e. likely a scanned/image PDF), the engine renders page screenshots (`getScreenshot({ scale: 2.0 })`) and runs `tesseract.js` (`eng`) page by page, emitting `OCR processing page i/n` events. Trained data is cached under `src/lib/ocr-data`.
3. If still effectively empty after OCR, the engine returns a clear error.

---

## 4. Two-step Groq prompting

The combined knowledge is truncated to **~15,000 chars**, then:

**Step 1 — Extraction** (`llama-3.1-8b-instant`, `temperature 0.1`, `response_format: json_object`)
→ a structured Business Profile JSON: `businessName`, `tone`, `coreServices`, `pricing`, `keyFacts`, `targetAudience`, `rules`.

**Step 2 — Prompt Architect** (`llama-3.3-70b-versatile`, `temperature 0.3`)
→ a first-person system prompt covering Identity & Mission, Knowledge Base, Operational Guidelines (brevity, no hallucination, gentle lead capture), and Tone.

The result streams back as `{ success: true, prompt, extraction }`.

### Why split into two steps?
- **Accuracy** — extracting facts first, then writing the prompt, reduces hallucination. Each call has one job: *"What are the facts?"* then *"How should I speak?"*
- **Cost/speed** — the cheap fast model does the bulk extraction; the bigger model is used only once, where prompt quality matters most.
- **Determinism** — JSON mode + low temperature make extraction reliable and parseable.

---

## 5. Streaming (SSE)

The route returns a `ReadableStream` with `Content-Type: text/event-stream`. Events:
- `{ status }` — `Reading <url>…`, `Fetching deeper context (i/n)…`, `Reading PDF…`, `OCR processing page i/n…`, `Analyzing business model…`, `Generating optimized prompt…`
- `{ error }` — failure; stream closes.
- `{ success, prompt, extraction }` — final payload.

This gives the user live, reassuring feedback during a multi-second pipeline instead of a frozen spinner.

---

## 6. Safeguards
- **Auth + RBAC** — must be signed in; viewers are blocked.
- **Rate limit** — 3 requests/min per IP (this is a high-compute path).
- **SSRF** — private/internal/metadata URLs are blocked (`isSSRFTarget`, see [Security](./security.md)).
- **Bounded cost** — knowledge truncated to 15k chars; bot name/role lengths capped.

---

## Related docs
- [Groq API Integration](./groq-api.md)
- [API Reference](./api-reference.md)
- [Architecture](./architecture.md)
- [Security](./security.md)
