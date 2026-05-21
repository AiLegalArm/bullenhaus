# Bullenhaus — Architecture

## 1. Overview

Bullenhaus is a unified platform that merges the **Trading Platform** (Trade-V2) and the **CRM Platform** (Aura Enterprise CRM) into a single system with one shared Supabase PostgreSQL database, one shared authentication flow, and strict domain isolation enforced at three layers: frontend route guards, backend JWT middleware, and database RLS policies.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (User)                               │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              Unified Login Page  /auth/login                 │  │
│   └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│         ┌────────────────────┼────────────────────────┐             │
│         ▼                   ▼                         ▼             │
│   /crm/*  (CRM UI)   /trade/*  (Trading UI)   /admin/* (Admin UI)  │
│   CRM_AGENT           TRADER                   SUPER_ADMIN          │
│   CRM_MANAGER         TRADING_OPERATOR                              │
│   CRM_DIRECTOR                                                      │
│   CRM_ADMIN                                                         │
└──────────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼────────────────────────────────────────┐
│                     Express.js Backend API                           │
│                     /api/v1/*                                        │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Auth       │  │ CRM        │  │ Trading    │  │ Admin         │  │
│  │ /auth/*    │  │ /crm/*     │  │ /trading/* │  │ /admin/*      │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              Middleware Stack                                    │ │
│  │  requireAuth → domainGuard → requirePermissions                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                              │ Prisma ORM (DATABASE_URL)
┌─────────────────────────────▼────────────────────────────────────────┐
│                  Supabase PostgreSQL                                  │
│                  (Single shared database)                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  CRM Tables  │  │Trading Tables│  │ Shared Tables│               │
│  │  Client      │  │TradingAccount│  │ User         │               │
│  │  Lead        │  │Position      │  │ Role         │               │
│  │  Call        │  │Order         │  │ Permission   │               │
│  │  ...         │  │Wallet        │  │ AuditLog     │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │             Row Level Security (RLS)                            │ │
│  │  Domain isolation enforced at database level                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                              │ (separate process)
┌─────────────────────────────▼────────────────────────────────────────┐
│                     Worker Service                                    │
│  - CRM/Trading sync                                                   │
│  - Background jobs                                                    │
│  - Uses service_role key (server-only)                               │
│  - Idempotency + retry + audit logging                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Same stack as both existing projects |
| Styling | Tailwind CSS | Shared design tokens |
| State | Zustand (Trading) + React Query (CRM) | Per-domain stores |
| Backend | Express.js + TypeScript | Unified API server |
| ORM | Prisma | Single schema, unified migrations |
| Database | Supabase PostgreSQL | Single instance |
| Auth | JWT (HS256) + HttpOnly cookies | Custom — NOT Supabase Auth |
| Password | Argon2id (bcrypt fallback) | Security upgrade from bcrypt-only |
| Token denylist | Redis (optional) / DB fallback | For logout-all |
| Deploy | Vercel (frontend) + Railway/Fly.io (backend) | Or single Vercel monorepo |

---

## 4. Domain Modules

### 4.1 Shared Auth Module (`/api/v1/auth/`)

All users of all domains log in through the same endpoint. After login, the backend determines `domain` from the user record and embeds it in the JWT. The frontend reads `domain` from the token and performs the redirect.

```
POST /api/v1/auth/login     → { accessToken, user: { domain, systemRole, ... } }
POST /api/v1/auth/refresh   → { accessToken }
POST /api/v1/auth/logout    → 200
POST /api/v1/auth/register  → (Trading users self-register as TRADER)
```

### 4.2 CRM Module (`/api/v1/crm/`)

Access: `CRM_ADMIN`, `CRM_DIRECTOR`, `CRM_MANAGER`, `CRM_AGENT`, `SUPER_ADMIN`
Locked to users with `domain IN ('CRM', 'BOTH')`

Key sub-modules: clients, leads, calls, notes, tasks, teams, approvals, reports, AI insights, advertisers, data management

### 4.3 Trading Module (`/api/v1/trading/`)

Access: `TRADING_OPERATOR`, `TRADER`, `SUPER_ADMIN`
Locked to users with `domain IN ('TRADING', 'BOTH')`

Key sub-modules: accounts, positions, orders, wallets, kyc, market-control, deposits, withdrawals, referrals

### 4.4 Admin Module (`/api/v1/admin/`)

Access: `SUPER_ADMIN` only
Provides cross-domain views, user management, role assignment, audit log access.

### 4.5 Worker Service (`/src/server/workers/`)

- Runs as a separate Node.js process (or cron)
- Uses `SUPABASE_SERVICE_ROLE_KEY` — **never exposed to frontend**
- Handles: CRM↔Trading sync events, background processing, stale job cleanup
- All operations are idempotent (idempotency key per job)
- All operations logged to `AuditLog`

---

## 5. Isolation Architecture

```
CRM User Request:
  Auth middleware checks JWT → domain = 'CRM'
  Route guard: /crm/* → allow, /trade/* → 403
  DB query: RLS policy auth.is_crm_user() = true, auth.is_trading_user() = false
  Result: CRM user can NEVER access Trading data

Trading User Request:
  Auth middleware checks JWT → domain = 'TRADING'
  Route guard: /trade/* → allow, /crm/* → 403
  DB query: RLS policy auth.is_trading_user() = true, auth.is_crm_user() = false
  Result: Trading user can NEVER access CRM data

Super Admin Request:
  JWT → domain = 'BOTH', systemRole = 'SUPER_ADMIN'
  Route guard: all routes allowed
  DB: auth.is_super_admin() = true → all policies allow
```

---

## 6. Shared Components

Located in `src/components/`:

- `auth/LoginForm.tsx` — unified login form
- `auth/MfaForm.tsx` — MFA verification
- `layout/ProtectedRoute.tsx` — domain-aware route guard
- `layout/DomainRedirect.tsx` — post-login redirect logic
- `layout/AppShell.tsx` — shared outer shell

Domain-specific components stay in `src/components/crm/` and `src/components/trading/`.

---

## 7. Database Schema Strategy

The unified schema keeps the CRM Prisma schema as the base and adds:

1. `systemRole` and `domain` columns to `User`
2. `TradingAccount` table linked to `User`
3. `Position`, `Order`, `Wallet` tables (Trading domain)
4. RLS policies on all tables enforcing domain isolation
5. `SyncEventsLog` table for CRM↔Trading webhook idempotency
6. `WorkerJob` table for background job tracking

The Trade-V2 `public.users` table (Supabase Auth linked) is **deprecated** in favor of the unified Prisma `User` table. Migration maps existing trading users to the new schema.

---

## 8. Security Architecture

| Concern | Solution |
|---|---|
| XSS token theft | Access token stored in-memory only (never localStorage) |
| CSRF | Refresh token in HttpOnly SameSite=Strict cookie |
| Token replay after logout | JWT denylist (Redis or DB-backed jti table) |
| Privilege escalation | Permissions loaded fresh from DB on each request |
| service_role key exposure | Used only in Worker/backend — never in frontend bundle |
| Domain bypass | RLS enforced at DB level even if middleware is bypassed |
| Brute force | Account lockout after 5 failures / 15 min |
| SQL injection | Prisma parameterized queries only |
| Sensitive env in git | `.env` in `.gitignore`, `.env.example` with placeholders |
