# Email (Transactional Notifications)

All outbound email is handled by **Nodemailer** over SMTP from a single module: `src/lib/mail.ts`. There are no third-party email APIs — just an SMTP transport configured from environment variables.

---

## Transport

```ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === "465", // implicit TLS on 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
```

If `SMTP_USER`/`SMTP_PASS` are missing, every send function **logs a warning and returns gracefully** instead of throwing — so local development works without email configured. (Reset-password and invite sends will surface failures where it matters.)

---

## The four emails

| Function | Trigger | Subject |
| --- | --- | --- |
| `sendLeadNotification` | A lead is captured (`LeadService.captureLead`) | 🚀 New Lead Captured for {botName}! |
| `sendResetPasswordEmail` | `POST /api/auth/forgot-password` | 🔒 Reset your Hey-Pixi password |
| `sendUsageWarningEmail` | Token usage hits 85% (free plan) in `ChatService`, or via `simulateUsage` | ⚠️ Action Required: Usage Limit at {%}! |
| `sendProjectInviteEmail` | `inviteTeamMember` server action | ✉️ Invitation to join {inviter}'s team |

Each is a self-contained, inline-styled responsive HTML template (table-based for email-client compatibility) with a branded header gradient and a primary CTA button.

### 1. Lead notification
Sent to the **bot creator** when their agent captures a contact. Includes name/email/phone and a "View Lead in Dashboard" link. Failure is logged but never blocks lead capture.

### 2. Password reset
Sent to the requesting user with a `…/auth/reset-password?token=…` link, noting the **15-minute** validity. This send **throws** on failure (the route logs it).

### 3. Usage warning
Sent once when a free-plan account crosses 85% of `tokenLimit`. Shows `usage / limit` and an "Upgrade Plan" CTA to `/dashboard/profile`. Fired fire-and-forget from the chat path so it never delays a reply.

### 4. Project invite
Sent when an admin invites a teammate:
- **New user** → link to `…/auth/signup?email=…`.
- **Existing user** (added directly) → link to `…/auth/signin`.

---

## Configuration

```bash
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587            # or 465 for implicit TLS
SMTP_USER=apikey-or-username
SMTP_PASS=secret
EMAIL_FROM="Hey-Pixi <noreply@heypixi.in>"   # optional; falls back to a sensible default per template
NEXTAUTH_URL=https://heypixi.in              # used to build dashboard/links inside emails
```

Common providers: Gmail SMTP, SendGrid SMTP, Mailgun SMTP, Amazon SES SMTP, Resend SMTP.

---

## Design notes / gotchas

- **Idempotency of warnings** — the usage warning relies on `subscriptionStatus = "warning_sent"` so it isn't sent repeatedly. See [Database Models](./database-models.md).
- **Non-blocking** — lead and usage emails are `.catch()`-ed so a mail outage never breaks the core flow.
- **Links** — every template uses `process.env.NEXTAUTH_URL` (with localhost fallback) to build absolute URLs.

---

## Related docs
- [Authentication](./authentication.md)
- [Workspaces & RBAC](./workspaces-rbac.md)
- [Chatbot](./chatbot.md)
