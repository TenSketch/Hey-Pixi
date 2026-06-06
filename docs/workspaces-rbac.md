# Workspaces, Teams & RBAC

Hey-Pixi is multi-tenant at the **workspace** level. A workspace is owned by one user; other users can be invited into it as members with a role. All agents, leads, payments, and the subscription are shared within a workspace.

---

## 1. Core concepts

| Concept | Where | Meaning |
| --- | --- | --- |
| **Owner** | `User._id` | The root of a workspace. Always behaves as `admin` in their own workspace. |
| **Member** | `User.parentId` | A user whose `parentId` points at an owner. Inherits access to that owner's data. |
| **Role** | `User.role` (`admin \| manager \| viewer`) | The member's permission level within the workspace. |
| **Active workspace** | `activeWorkspace` cookie | Which workspace the user is currently acting in (`personal` or an owner id). |

A single account can switch between its **personal** workspace and an **invited** workspace via the `WorkspaceSwitcher` UI.

---

## 2. Resolving the active workspace

`src/lib/workspace.ts` is the authority. Every data-scoped operation calls one of:

- `getActiveOwnerId(dbUser)` / `getActiveOwnerIdMongoose(dbUser)` → the effective `ownerId`.
- `getActiveWorkspaceContext(dbUser)` / `…Mongoose(dbUser)` → `{ ownerId, role, isPersonal }`.

Resolution logic:
1. Cookie absent or `"personal"` → `ownerId = user._id`, role `admin`, `isPersonal = true`.
2. Cookie = an owner id the user is **actually invited to** (`user.parentId` matches) → that owner id, role = `user.role`, `isPersonal = false`.
3. Invalid cookie → fall back to `parentId || _id`.

Switching is done by `switchWorkspace(workspaceId)` (`lib/actions/workspace-actions.ts`), which sets the cookie (httpOnly, 1-year) and revalidates the dashboard routes.

---

## 3. Roles & permissions

| Capability | admin | manager | viewer |
| --- | :---: | :---: | :---: |
| View dashboard / leads | ✅ | ✅ | ✅ |
| Run analysis (`/api/analyze`) | ✅ | ✅ | ❌ |
| Create / edit agents | ✅ | ✅ | ❌ |
| Update lead status | ✅ | ✅ | ❌ |
| Payments / subscribe | ✅ | ✅ | ❌ |
| Delete agents | ✅ | ❌ | ❌ |
| Manage team (invite/remove) | ✅ (owner only) | ❌ | ❌ |

Enforcement is **always server-side**. Mutating routes/actions compute the effective role from the active workspace and return `403` (`UnauthorizedError`) when insufficient. Team management additionally requires `isPersonal === true` — i.e. you can only manage members of a workspace **you own**.

---

## 4. Inviting members

`inviteTeamMember(email, role)` in `src/lib/actions/team-actions.ts`:

- **Owner/admin only** (`checkAdminAuth`).
- Cannot invite yourself or the existing owner.
- **If the invitee already has an account:** they're added directly — `parentId` and `role` are set, a `ProjectInvite` is upserted as `accepted`, and a notification email links them to sign-in.
- **If they don't:** a `pending` `ProjectInvite` is created (or updated) and an invite email links them to `signup?email=…`. When they register with that email, the workspace association is applied.

`removeTeamMember(memberId)` unsets `parentId` and resets the member's role to `admin` (back to their own personal workspace), and deletes the invite record.

`revokeInvite(inviteId)` deletes a still-pending invitation.

`getTeamData()` returns active members, pending invites, the caller's role, and owner info for the team UI (`/dashboard/profile`).

> **Implementation note:** these functions read/write the `users` collection via the **native MongoDB driver** (`getUsersCollection()`), not Mongoose, because Mongoose 8.x was observed to silently fail to persist `parentId`/`role`. They also self-heal legacy users missing `role`/`tokenUsage`/`tokenLimit`/`subscriptionPlan`.

---

## 5. Self role change & usage simulation

`src/lib/actions/user-actions.ts`:
- `updateUserRole(role)` — lets a user set their own role (used in dev/admin flows); revalidates dashboard routes.
- `simulateUsage(tokens)` — testing utility that sets `tokenUsage` and recomputes `subscriptionStatus` (≥100 → `exhausted`, ≥85 → `warning_sent` + warning email).

---

## 6. Data model

`ProjectInvite` (`src/models/ProjectInvite.ts`) — `{ email (unique), role, invitedBy, ownerId, status }`.

Workspace membership lives on `User.parentId` + `User.role`. See [Database Models](./database-models.md).

---

## Related docs
- [Authentication](./authentication.md)
- [Database Models](./database-models.md)
- [Email](./email.md)
- [API Reference](./api-reference.md)
