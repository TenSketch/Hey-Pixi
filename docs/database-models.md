# Database Models

Hey-Pixi stores everything in **MongoDB**. Two connection layers exist:

| File | Driver | Used by |
| --- | --- | --- |
| `src/lib/mongodb.ts` | **Mongoose** (`dbConnect`) | Application models & business logic. Cached across hot-reloads via a global. |
| `src/lib/mongodb-client.ts` | **Native MongoClient** (`clientPromise`) | The Auth.js `MongoDBAdapter` (sessions/users at the auth layer) and a few places that need raw collection access. |

> Some team operations in `src/lib/actions/team-actions.ts` deliberately use the **native** `users` collection (`mongoose.connection.db.collection("users")`) because Mongoose 8.x was observed to silently drop `parentId`/`role` updates in this codebase. Keep that in mind when editing those fields.

Models are exported from `src/models/index.ts` and re-import safely (each guards against re-registration during hot reload).

---

## User — `src/models/User.ts`

The central account/identity document.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `email` | string | — | Required, unique. |
| `name` | string | — | Required. |
| `password` | string? | — | bcrypt hash. Absent for adapter-only/OAuth users. |
| `subscriptionPlan` | `"free" \| "pro"` | `free` | |
| `role` | `"admin" \| "manager" \| "viewer"` | `admin` | Workspace RBAC role. |
| `tokenUsage` | number | `0` | Messages consumed this cycle. |
| `tokenLimit` | number | `100` | `100` free / `10000` pro. |
| `subscriptionStatus` | `active \| warning_sent \| exhausted \| past_due` | `active` | |
| `paymentMandateId` | string? | — | Razorpay subscription id. |
| `autoRenew` | boolean | `false` | |
| `resetPasswordToken` | string? | — | Password-reset token. |
| `resetPasswordExpires` | Date? | — | 15-min expiry. |
| `parentId` | ObjectId? → User | — | Set when this user is a **member** of another workspace. |
| `createdAt` / `updatedAt` | Date | — | `timestamps: true`. |

> Note: the model deletes any cached `mongoose.models.User` before registering, ensuring schema changes take effect on reload.

Related: [Authentication](./authentication.md), [Payments](./payments.md).

---

## BotConfig — `src/models/BotConfig.ts`

A single AI agent.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `userId` | ObjectId → User | — | **Workspace owner** id (not necessarily creator). Required. |
| `name` | string | — | Required. Shown in widget header. |
| `role` | string | — | Required. The bot's job description. |
| `url` | string | — | Source site (optional for PDF bots). |
| `systemPrompt` | string | — | Required. Groq-generated brain. |
| `themeColor` | string | `#0f172a` | Widget accent color. |
| `isActive` | boolean | `false` | Flips true after activation payment. |

Index: `{ userId: 1, createdAt: -1 }`.

Related: [Chatbot](./chatbot.md).

---

## Lead — `src/models/Lead.ts`

A captured contact from a conversation.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `botId` | ObjectId → BotConfig | — | Required. |
| `name` | string? | — | |
| `phone` | string? | — | Normalized to 10 digits before save. |
| `email` | string? | — | Lowercased before save. |
| `lastMessage` | string | — | Last user message / selected service. |
| `transcript` | Mixed[] | `[]` | Conversation history snapshot. |
| `status` | `new \| contacted \| qualified \| closed \| resolved` | `new` | CRM pipeline stage. |

Index: `{ botId: 1, createdAt: -1 }`.

Related: [Chatbot](./chatbot.md), `src/lib/services/lead.service.ts`.

---

## Payment — `src/models/Payment.ts`

A Razorpay transaction record (activation or subscription charge).

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId → User | Required. |
| `botId` | ObjectId → BotConfig | Required for activation; absent for subscription charges. |
| `amount` | number | In paise. |
| `currency` | string | `INR`. |
| `razorpayOrderId` | string | |
| `razorpayPaymentId` | string | **Unique** — prevents replay/double-processing. |
| `razorpaySignature` | string | |
| `status` | `successful \| failed \| pending` | |

Index: `{ userId: 1, createdAt: -1 }`.

Related: [Payments](./payments.md).

---

## ProjectInvite — `src/models/ProjectInvite.ts`

Tracks team invitations into a workspace.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required, unique, lowercased. |
| `role` | `admin \| manager \| viewer` | Role to grant on acceptance. |
| `invitedBy` | ObjectId → User | The admin who invited. |
| `ownerId` | ObjectId → User | The workspace being joined. |
| `status` | `pending \| accepted` | `pending` until the invitee registers/joins. |

Related: [Workspaces & RBAC](./workspaces-rbac.md).

---

## Relationships at a glance

```
User (owner) ──< BotConfig ──< Lead
   │                  │
   │                  └──< Payment (activation)
   ├──< Payment (subscription)
   ├──< ProjectInvite (ownerId)
   └──< User (members, via parentId)
```

---

## Related docs
- [Authentication](./authentication.md)
- [Payments](./payments.md)
- [Chatbot](./chatbot.md)
- [Workspaces & RBAC](./workspaces-rbac.md)
