# Bullenhaus — Unified CRM + Trading Platform

A unified system merging the Trading Platform (Trade-V2) and CRM Platform (Aura Enterprise CRM) into one application with shared authentication, strict domain isolation, and a single Supabase PostgreSQL database.

## Architecture Summary

- **CRM users** → `/crm/dashboard` — cannot see Trading data
- **Trading users** → `/trade/dashboard` — cannot see CRM data
- **Super Admin** → `/admin/dashboard` — full access to both domains
- **Single Supabase DB** with Row Level Security enforcing domain isolation
- **Custom JWT auth** (not Supabase Auth) — access token in memory, refresh token in HttpOnly cookie
- **Worker service** — background sync jobs with idempotency and audit logging

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- A Supabase project (PostgreSQL)
- Redis (optional — for JWT denylist; falls back to DB if not set)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd bullenhaus
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your real values
```

Required env vars:
- `DATABASE_URL` — Supabase transaction pooler (port 6543 + `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct connection (port 5432, for migrations)
- `JWT_ACCESS_SECRET` — min 32 bytes (`openssl rand -hex 32`)
- `JWT_REFRESH_SECRET` — min 32 bytes, different from above
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — **backend/worker only**, never in frontend
- `WORKER_API_KEY` — for worker service auth (`openssl rand -hex 32`)
- `SYNC_WEBHOOK_SECRET` — for HMAC-signed webhooks

### 3. Generate Prisma client

```bash
npm run db:generate
```

### 4. Run database migrations

```bash
# Apply Prisma schema migrations (uses DIRECT_URL)
npm run db:migrate

# Apply Supabase RLS policies
npm run rls:apply

# OR manually:
psql $DIRECT_URL -f supabase/migrations/001_add_unified_columns.sql
psql $DIRECT_URL -f supabase/migrations/002_create_trading_tables.sql
psql $DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql
psql $DIRECT_URL -f supabase/migrations/004_create_worker_jobs.sql
```

### 5. Seed roles and permissions

```bash
npm run db:seed
```

### 6. Create Super Admin (first time only)

```bash
# Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD in .env first
npm run admin:create
```

### 7. Run development server

```bash
npm run dev
```

This starts both the Express backend (port 3000) and Vite frontend dev server concurrently.

---

## Migration from existing systems

If migrating from Trade-V2 + Aura CRM, see [`docs/MIGRATION_PLAN.md`](docs/MIGRATION_PLAN.md) for the full step-by-step guide.

Quick summary:
1. Run schema migrations (additive — no data loss)
2. Map existing CRM roles to new `systemRole` values
3. Export Trade-V2 users and import via `scripts/migrate-trading-users.ts`
4. Verify migration: `npm run db:verify`
5. Trigger password reset emails for migrated trading users

---

## Running the Worker Service

The worker handles background sync jobs between CRM and Trading systems.

```bash
# In a separate process / container
npm run worker:start
```

The worker authenticates via `WORKER_API_KEY` (not JWT). It uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for cross-domain operations.

---

## Testing

```bash
# TypeScript type check
npm run lint

# Unit tests
npm test

# Integration tests (requires test DB)
npm run test:integration

# Smoke tests against a live environment
npm run test:smoke -- --url https://staging.bullenhaus.com
```

See [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) for the full test specification.

---

## Deployment

See [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) for the complete pre-deploy checklist.

### Vercel (recommended for frontend + serverless)

```bash
npm i -g vercel
vercel --prod
```

Set all env vars in Vercel Dashboard → Settings → Environment Variables.
**Never** set `SUPABASE_SERVICE_ROLE_KEY` or `JWT_*_SECRET` as `VITE_` prefixed vars.

### Self-hosted (Railway / Fly.io for backend)

```bash
docker build -t bullenhaus-api .
docker push registry/bullenhaus-api:latest
railway up   # or: flyctl deploy
```

---

## Project Structure

```
bullenhaus/
├── docs/                        # Architecture, RBAC, migration, deployment docs
│   ├── ARCHITECTURE.md
│   ├── MIGRATION_PLAN.md
│   ├── RBAC_MATRIX.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── TEST_PLAN.md
├── prisma/
│   ├── schema.prisma            # Unified Prisma schema
│   └── seed-unified-roles.ts   # Role + permission seed
├── scripts/
│   ├── create-super-admin.ts   # Super Admin creation (env-based, safe)
│   └── verify-migration.ts     # Post-migration verification
├── src/
│   ├── config/
│   │   └── env.ts               # Env validation (fail-fast)
│   ├── types/
│   │   └── auth.types.ts        # Unified TypeScript types
│   ├── lib/
│   │   ├── rbac/
│   │   │   ├── roles.ts         # Role constants
│   │   │   ├── permissions.ts   # Permission constants
│   │   │   └── access.ts        # Access check helpers
│   │   ├── auth/
│   │   │   └── authClient.ts    # Frontend auth client (in-memory token)
│   │   └── supabase/
│   │       ├── browserClient.ts # Supabase browser client (anon key)
│   │       ├── serverClient.ts  # Supabase server client
│   │       └── serviceClient.ts # Supabase service client (backend only)
│   ├── server/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts  # JWT verification + domain guard
│   │   │   ├── domain.guard.ts     # CRM/Trading domain isolation
│   │   │   └── worker.guard.ts     # API key check for worker
│   │   ├── services/
│   │   │   └── auth.service.ts     # Login, refresh, logout, MFA
│   │   └── workers/
│   │       └── job.worker.ts       # Worker base with idempotency + retry
│   ├── app/
│   │   └── login/
│   │       └── LoginPage.tsx       # Unified login page
│   └── components/
│       ├── layout/
│       │   └── ProtectedRoute.tsx  # Domain-aware route guard
│       └── auth/
│           └── LoginForm.tsx       # Login form component
└── supabase/
    └── migrations/
        ├── 001_add_unified_columns.sql   # Add systemRole + domain to User
        ├── 002_create_trading_tables.sql # TradingAccount + trading tables
        ├── 003_rls_domain_isolation.sql  # Full RLS policies
        └── 004_create_worker_jobs.sql    # WorkerJob table
```

---

## Security Notes

- Access tokens are stored **in memory only** (never `localStorage`) — XSS protection
- Refresh tokens are in **HttpOnly, SameSite=Strict cookies** — CSRF protection
- Permissions are loaded **fresh from DB on every request** — no stale-permission attacks
- `SUPABASE_SERVICE_ROLE_KEY` is **never bundled into frontend** code
- RLS policies enforce domain isolation **at the database level** — middleware bypass is not enough
- Account lockout after 5 failed login attempts (15-minute lockout window)
- All auth events are written to the immutable `AuditLog` table

---

## Documentation

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, tech stack, module breakdown |
| [`docs/MIGRATION_PLAN.md`](docs/MIGRATION_PLAN.md) | Step-by-step migration from Trade-V2 + Aura CRM |
| [`docs/RBAC_MATRIX.md`](docs/RBAC_MATRIX.md) | Role definitions, permission matrices, route access |
| [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) | Pre-deploy checklist, migration order, rollback |
| [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) | Full test specification (login, RBAC, RLS, worker, smoke) |
