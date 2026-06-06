# Authentication & Authorization

Hey-Pixi uses **Auth.js (NextAuth v5 beta)** with a Credentials provider, a MongoDB adapter, and JWT sessions. On top of authentication it layers a **role-based access control (RBAC)** model and a **shared-workspace** system.

---

## 1. Stack

| Concern | Library / file |
| --- | --- |
| Auth framework | `next-auth@5` |
| Adapter | `@auth/mongodb-adapter` over `src/lib/mongodb-client.ts` |
| Password hashing | `bcryptjs` (cost factor 10) |
| Session strategy | JWT (`session.strategy = "jwt"`) |
| Edge config | `src/auth.config.ts` |
| Node config | `src/auth.ts` |
| Route protection | `src/middleware.ts` + `authorized` callback |

### Why two config files?
NextAuth v5 runs part of its logic in the **Edge** runtime (middleware) and part in **Node** (the credentials `authorize` callback that needs `bcrypt` + Mongoose).

- `src/auth.config.ts` — Edge-safe. Contains callbacks (`authorized`, `redirect`, `session`), the session strategy, and custom pages. Uses an empty `Credentials({})` just to satisfy types.
- `src/auth.ts` — Full Node config. Spreads `authConfig`, adds the `MongoDBAdapter`, and defines the real `authorize` logic. Exports `handlers`, `signIn`, `signOut`, `auth`.

---

## 2. Sign-up flow

`POST /api/auth/register` (`src/app/api/auth/register/route.ts`):
1. **Rate limit** — 5 registrations/hour per IP.
2. **Validation** — name (1–100 chars), email (regex), password (≥8 chars **and** must contain a digit).
3. **Uniqueness** — rejects an already-registered email.
4. **Hashing** — `bcrypt.hash(password, 10)`.
5. **Create** — stores the `User` document (role defaults to `admin`, plan `free`, `tokenLimit: 100`).

UI pages: `src/app/auth/signup/page.tsx` (and `signin`).

---

## 3. Sign-in flow

The Credentials provider's `authorize` (`src/auth.ts`):
1. Looks up the user by lowercased email.
2. Returns `null` if no user or no stored password.
3. Compares the submitted password against the stored hash with `bcrypt.compare` (trimming the stored hash).
4. On success returns `{ id, name, email }` → NextAuth issues a JWT.

The `session` callback copies `token.sub` onto `session.user.id` so server code can resolve the DB user.

---

## 4. Password reset flow

Two endpoints + two pages implement a standard token-based reset.

### Request a reset — `POST /api/auth/forgot-password`
- Rate limited to **3/hour per IP**.
- Validates email format.
- **Anti-enumeration**: always returns the same generic success message whether or not the email exists.
- If the user exists: generates a `crypto.randomBytes(32)` hex token, stores it on the user with a **15-minute** expiry (`resetPasswordToken`, `resetPasswordExpires`), and emails a link `…/auth/reset-password?token=…`.
- In development the reset URL is also logged to the server console.

### Complete the reset — `POST /api/auth/reset-password`
- Validates the new password (≥8 chars, contains a digit).
- Finds a user with a matching, **non-expired** token (`resetPasswordExpires > now`).
- Hashes the new password, saves it, and clears the token fields (single-use).

Email templates live in `src/lib/mail.ts` (see [Email](./email.md)).

---

## 5. Route protection

### Middleware — `src/middleware.ts`
Runs on every non-static route. It composes the Auth.js middleware (for the `authorized` check) and injects **security headers** (CSP, HSTS, `X-Content-Type-Options`, etc.). See [Chatbot](./chatbot.md) for the widget CSP exception and [Security](./security.md) for the full header set.

### `authorized` callback — `src/auth.config.ts`
- `/dashboard/*` → requires a logged-in user, else redirect to sign-in.
- `/auth/*` while already logged in → redirect to `/dashboard`.
- Everything else → public.

---

## 6. RBAC — roles

Defined on the `User` model: `role ∈ { admin, manager, viewer }`.

| Action | admin | manager | viewer |
| --- | :---: | :---: | :---: |
| View dashboard / leads | ✅ | ✅ | ✅ |
| Run content analysis | ✅ | ✅ | ❌ |
| Create / edit agents | ✅ | ✅ | ❌ |
| Update lead status | ✅ | ✅ | ❌ |
| Make payments / subscribe | ✅ | ✅ | ❌ |
| Delete agents | ✅ | ❌ | ❌ |
| Manage team members | ✅ (owner only) | ❌ | ❌ |

Enforcement is **server-side** in every mutating API route and server action via `getActiveWorkspaceContextMongoose(dbUser)`, which returns the effective `role` for the active workspace. Viewers and non-admins get `403`.

---

## 7. Shared workspaces

A user can belong to another user's workspace. This is the multi-tenant/team layer.

- `User.parentId` — if set, this user is a **member** of the workspace owned by `parentId`.
- An **active workspace** is tracked in the `activeWorkspace` cookie (`personal` or an owner ObjectId).
- `src/lib/workspace.ts` resolves the effective `ownerId` + `role`:
  - cookie `personal`/absent → own `_id`, role `admin`.
  - cookie = an owner id the user is actually invited to → that owner id, role = `user.role`.
  - invalid cookie → falls back to `parentId || _id`.

All data queries (bots, leads, payments) are scoped to the resolved `ownerId`, so members see the owner's agents and CRM and share the owner's subscription.

Team management (invites, removal, role changes) lives in `src/lib/actions/team-actions.ts` and the `ProjectInvite` model — see [Workspaces & RBAC](./workspaces-rbac.md).

---

## 8. Environment

```bash
AUTH_SECRET=         # 32+ char random string for JWT encryption
NEXTAUTH_URL=        # base URL, used in emails & redirects (e.g. https://heypixi.in)
MONGODB_URI=         # adapter + user store
```

---

## Related docs
- [Workspaces & RBAC](./workspaces-rbac.md)
- [Email](./email.md)
- [Security](./security.md)
- [Database Models](./database-models.md)
