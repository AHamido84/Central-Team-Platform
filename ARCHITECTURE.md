# Central Team Platform — Architecture (Phase 0)

Phase 0 establishes the foundation for the full Marketing Agency Operating System. It intentionally
does **not** implement every entity's UI — it implements the data model, the i18n/RTL shell, and
authentication/authorization correctly, plus one real vertical slice (Client → Project → Scope) that
proves the whole stack works end-to-end.

## 1. Core concept

The core entity is the **Client**, not the campaign:

```
Client → Contract/Scope → Project → Requests → Tasks → Deliverables
                                   → (optional) Campaigns
                                   → (optional) Leads → Opportunities
```

A Project can be anything (a single brochure, a video, a full campaign). Campaigns, Leads and
Opportunities are optional project components — nothing in the schema requires them.

## 2. Tech stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS + shadcn/ui ("New York" style)
- PostgreSQL + Prisma
- next-intl for i18n/routing
- Auth.js v5 (`next-auth@5`) — Credentials provider + Prisma adapter
- Vitest for unit tests

## 3. Language & RTL architecture

Arabic (`ar`) is the default and primary locale; English (`en`) is a secondary localization —
not the other way around.

- Routing is locale-prefixed via `next-intl`: `/ar/...` (default), `/en/...`.
- `src/app/[locale]/layout.tsx` sets `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
  Direction is never inferred from CSS alone — it is a real document attribute.
- All spacing/alignment utilities use Tailwind **logical properties** (`ps-*`, `pe-*`, `ms-*`,
  `me-*`, `start-*`, `end-*`, `text-start`, `text-end`) instead of `l/r` utilities, so every
  component mirrors automatically under `dir="rtl"` without per-component overrides.
- Directional icons (chevrons, arrows, breadcrumb separators) go through a `<DirectionalIcon>`
  wrapper (`src/components/layout/directional-icon.tsx`) that flips them under RTL — this is the
  single place that knows about icon mirroring, not scattered CSS.
- Fonts are locale-driven: **IBM Plex Sans Arabic** for `ar`, **Inter** for `en`, both loaded via
  `next/font/google` and applied as the `<html>` font class in the root locale layout.
- Every string shown to a user — navigation, buttons, forms, statuses, notifications, validation,
  empty states, errors, tooltips, table headers, page titles — comes from `next-intl` translation
  keys under `src/i18n/messages/{ar,en}/*.json`. No UI text is hard-coded in components.
  `ar/*.json` is authored first and is the source of truth; `en/*.json` mirrors every key.

## 4. Data model

See `prisma/schema.prisma` for the authoritative definitions. Summary of the non-obvious calls:

| Decision | Reasoning |
|---|---|
| `User.clientId` nullable FK → `Client` | `null` = internal agency staff, set = client-portal user. This one field is the root of all client-scoping. |
| `User.roleId` single FK → `Role`, `Role`↔`Permission` many-to-many via `RolePermission` | One role per user is enough for Phase 0; multi-role is an additive migration later, not a rewrite. |
| `ProjectType`, `RequestType` are DB tables | Spec requires these to be admin-configurable, not hard-coded enums. |
| `ScopeItem.category` is a Prisma enum, not a table | Only `ProjectType` was required to be configurable; the fixed category list + `OTHER` covers real usage without a management UI nobody asked for yet. |
| `ProjectScope` wraps `ScopeItem[]` (1 project → 1 active scope → many items) | Leaves room for scope revisions/approval workflow later without restructuring. |
| `Campaign`, `Lead`, `Opportunity` all optionally relate to `Project` | A brochure project has none of these — nothing in the schema forces their existence. |
| `Comment`, `Approval` are polymorphic via `entityType` enum + `entityId` string, no DB-level FK | Standard Prisma trade-off for polymorphic association across many entity types; enforced in application code, not the DB. |
| `AuditLog` + `lib/audit.ts` exist now, only lightly wired | The table and a `recordAudit()` helper exist so later phases just call it; not every mutation logs yet. |

Full entity list: `User, Role, Permission, RolePermission, Client, ClientContact, Contract,
ProjectType, Project, ProjectScope, ScopeItem, RequestType, Request, Task, Deliverable, Asset,
Campaign, Lead, Opportunity, Notification, Comment, Approval, Integration, AuditLog`.

## 5. Authentication & authorization

- **Authentication**: Auth.js v5, Credentials provider (email + bcrypt password hash), Prisma
  adapter for persistence, JWT session strategy. The session token carries `userId`, `roleId`,
  `roleName`, and `clientId` (null for staff).
- **Authorization** (`src/lib/authorization.ts`):
  - `requireUser()` — throws/redirects if there is no session.
  - `requirePermission(user, permissionKey)` — checks the user's role has the permission via
    `RolePermission`.
  - `assertClientScope(user, clientId)` — for client-portal users, throws unless
    `user.clientId === clientId`. Internal staff bypass this (subject to their role's
    permissions). **Every** server action / route handler that reads or writes Client-scoped data
    calls this — the client ID that matters is always re-derived from the session, never trusted
    from the request body/query string (spec §14).
- Route groups enforce this at the layout level: `app/[locale]/(internal)/layout.tsx` requires an
  internal role; `app/[locale]/(portal)/layout.tsx` requires a client-portal role and scopes all
  data fetches to `session.user.clientId`.

## 6. Folder structure

```
prisma/
  schema.prisma
  seed.ts                     # roles, permissions, demo admin + demo client/project
src/
  app/
    [locale]/
      (auth)/login/
      (internal)/              # staff dashboard — internal-role guard in layout.tsx
        clients/[id]/
        projects/[id]/
      (portal)/                # client portal — client-role guard + clientId scope in layout.tsx
        projects/
      layout.tsx               # <html lang dir>, font selection
    api/auth/[...nextauth]/route.ts
  components/
    ui/                        # shadcn primitives
    layout/                    # Sidebar, Header, Breadcrumbs, DirectionalIcon (RTL-aware)
  lib/
    prisma.ts
    auth.ts                    # Auth.js config
    authorization.ts
    audit.ts
  i18n/
    routing.ts
    request.ts
    messages/{ar,en}/{common,nav,auth,clients,projects,errors,validation}.json
  types/
proxy.ts                       # next-intl locale routing + auth guard (Next.js 16 "proxy" convention)
```

## 7. What Phase 0 does NOT build

Per the spec, functionality beyond the foundation is deliberately deferred: no Campaign/Lead/
Opportunity UI, no Request/Task/Deliverable workflow UI, no Integrations, no AI features, no
permissions-management UI (roles/permissions are seeded, not editable via UI yet). The schema and
authorization layer support all of these attaching later without migration surprises.
