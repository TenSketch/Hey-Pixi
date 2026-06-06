# Payments & Subscriptions (Razorpay)

Hey-Pixi monetizes in two ways, both via **Razorpay**:

1. **One-time bot activation** — pay once to flip a bot from inactive → active.
2. **Pro subscription** — a recurring plan that raises the account's message-token limit.

All amounts are in **INR** and stored in **paise** (smallest unit) where Razorpay requires it.

---

## 1. Pricing constants

Single source of truth: `src/lib/constants.ts`.

```ts
export const PRICING = {
  BOT_ACTIVATION_AMOUNT_PAISE: 1999 * 100, // ₹1999 in paise
  BOT_ACTIVATION_AMOUNT_INR: 1999,
  CURRENCY: "INR",
};
```

Token limits by plan (set on the `User` model / webhook):
- **Free**: `tokenLimit = 100` messages.
- **Pro**: `tokenLimit = 10000` messages.

---

## 2. One-time bot activation

A new `BotConfig` is created with `isActive: false`. It cannot serve traffic until paid for.

### Step 1 — Create an order: `POST /api/checkout/razorpay`
`src/app/api/checkout/razorpay/route.ts`
1. Requires an authenticated session.
2. Validates `botId` and resolves the active workspace (`getActiveWorkspaceContextMongoose`).
3. **RBAC** — viewers get `403`.
4. Confirms the bot exists, is owned by the workspace, and is **not already active**.
5. Creates a Razorpay **order** for `BOT_ACTIVATION_AMOUNT_PAISE`, embedding `{ botId, userId }` in `notes`.
6. Returns the `order` to the client, which opens the Razorpay checkout modal.

### Step 2 — Verify the payment: `POST /api/checkout/razorpay/verify`
`src/app/api/checkout/razorpay/verify/route.ts`
1. Requires a session; validates all four fields (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `botId`).
2. **Signature verification** — recomputes `HMAC-SHA256(order_id|payment_id, KEY_SECRET)` and compares to the returned signature. Mismatch → `400`.
3. Re-checks workspace ownership + RBAC.
4. Sets the bot `isActive: true`.
5. Records a `Payment` document. The `razorpayPaymentId` field is **unique**, so a replayed payment hits a `11000` duplicate-key error → returns `409` ("already processed").

> Verification happens **server-side** with the secret key. Never trust the client's "payment success" callback alone.

---

## 3. Pro subscription (recurring)

### Create a subscription: `POST /api/checkout/subscription`
`src/app/api/checkout/subscription/route.ts`
1. Auth + workspace resolution + RBAC (viewers `403`).
2. Requires `RAZORPAY_PLAN_ID` to be configured.
3. Creates a Razorpay **subscription** against that plan:
   - `total_count: 12` (e.g. 12 monthly cycles),
   - `customer_notify: 1`,
   - `notes.userId` = workspace owner id.
4. Returns `subscriptionId` + `keyId`; the client opens Razorpay checkout to authorize the mandate.

Subscription lifecycle is then driven entirely by **webhooks** (not the client), because recurring charges happen on Razorpay's schedule.

---

## 4. Webhook handler

`POST /api/webhook/payment` — `src/app/api/webhook/payment/route.ts`

1. Reads the raw body and verifies the `x-razorpay-signature` header against `RAZORPAY_WEBHOOK_SECRET` (HMAC-SHA256). If the secret is unset, verification is skipped with a warning (configure it in production!).
2. Dispatches on `event`:

| Event | Effect on the user |
| --- | --- |
| `subscription.charged` | Upgrade to **pro**: `tokenUsage → 0`, `tokenLimit → 10000`, status `active`, store `paymentMandateId`, `autoRenew = true`. Logs a `Payment` record. |
| `subscription.cancelled` / `subscription.expired` | Downgrade to **free**: `tokenLimit → 100`, status `active`, `autoRenew = false`. |
| `subscription.halted` | Payment failed: status → `past_due`. |

The webhook is the **authoritative** source for subscription state. The user identity is recovered from `subscription.notes.userId` set at creation time.

---

## 5. Data model

`Payment` (`src/models/Payment.ts`) records every transaction:
- `userId`, `botId`, `amount`, `currency`, `status`.
- `razorpayOrderId`, `razorpayPaymentId` (**unique**), `razorpaySignature`.
- Indexed by `{ userId, createdAt }`.

`User` subscription fields (`src/models/User.ts`):
- `subscriptionPlan: "free" | "pro"`.
- `subscriptionStatus: "active" | "warning_sent" | "exhausted" | "past_due"`.
- `tokenUsage`, `tokenLimit`, `paymentMandateId`, `autoRenew`.

How token limits gate the chatbot is described in [Groq API Integration](./groq-api.md#6-token-usage--billing-enforcement).

---

## 6. Environment

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=   # public key id (browser checkout)
RAZORPAY_KEY_ID=               # server key id
RAZORPAY_KEY_SECRET=           # server secret (order creation + signature verify)
RAZORPAY_PLAN_ID=              # plan id for the Pro subscription
RAZORPAY_WEBHOOK_SECRET=       # verifies incoming webhooks
```

The Razorpay checkout script is allow-listed in the CSP (`src/middleware.ts`): `checkout.razorpay.com`, `cdn.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com`.

---

## 7. Security checklist

- ✅ Order amount comes from server constants, never the client.
- ✅ Payment signature verified server-side before activation.
- ✅ Webhook signature verified before mutating state.
- ✅ Unique `razorpayPaymentId` prevents replay/double-activation.
- ✅ RBAC blocks viewers from initiating any payment.
- ✅ Ownership re-checked at both order and verify steps.

---

## Related docs
- [Authentication & Authorization](./authentication.md)
- [Database Models](./database-models.md)
- [Groq API Integration](./groq-api.md)
- [Security](./security.md)
