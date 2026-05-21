# Bullenhaus — Deployment Checklist

## Pre-Deployment Preparation

### Environment Variables

- [ ] Copy `.env.example` to `.env` (never commit `.env`)
- [ ] Set `DATABASE_URL` — Supabase transaction pooler URL (port 6543 + `?pgbouncer=true`)
- [ ] Set `DIRECT_URL` — Supabase direct connection URL (port 5432, for migrations)
- [ ] Set `JWT_ACCESS_SECRET` — min 32 bytes, generated with `openssl rand -hex 32`
- [ ] Set `JWT_REFRESH_SECRET` — min 32 bytes, different from ACCESS_SECRET
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Project Settings → API
- [ ] Set `WORKER_API_KEY` — generated with `openssl rand -hex 32`
- [ ] Set `SYNC_WEBHOOK_SECRET` — generated with `openssl rand -hex 32`
- [ ] Set `GEMINI_API_KEY` — if AI features are enabled
- [ ] Set `REDIS_URL` — if Redis token denylist is used (optional)
- [ ] Set `SUPER_ADMIN_EMAIL` — for super admin creation script
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT` (default 3000)
- [ ] Set `APP_URL` — public URL of the deployed app
- [ ] Set `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins

### Frontend-specific (Vite build env)

- [ ] Set `VITE_API_URL` — URL of the backend API (e.g. `https://api.bullenhaus.com`)
- [ ] **NEVER** set `VITE_SUPABASE_SERVICE_ROLE_KEY` — service role must not be in frontend
- [ ] `VITE_SUPABASE_URL` — only if frontend uses Supabase client for file storage (not auth)
- [ ] `VITE_SUPABASE_ANON_KEY` — only for non-auth Supabase usage

---

## Supabase Setup

- [ ] Create Supabase project (or use existing shared project)
- [ ] Enable pgcrypto extension: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- [ ] Confirm Supabase Auth is **disabled** for Bullenhaus (auth is handled by custom JWT)
  - OR: Keep Supabase Auth enabled for trading users only, with migration plan
- [ ] Confirm Row Level Security is enabled on all tables (auto-enforced by migration)
- [ ] Set `request.jwt.claims` function exists (created by migration 003)
- [ ] Test connection pooler URL with `?pgbouncer=true`
- [ ] Test direct URL (port 5432) with a migration run on staging

---

## Migration Order

Run in exact order. Do NOT skip steps.

```bash
# Step 1: Install dependencies
npm install

# Step 2: Generate Prisma client
npx prisma generate

# Step 3: Apply Prisma schema migrations (uses DIRECT_URL)
npx prisma migrate deploy

# Step 4: Apply Supabase-specific RLS policies
psql $DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql
psql $DIRECT_URL -f supabase/policies/audit_log_policies.sql

# Step 5: Seed unified roles and permissions
npx tsx prisma/seed-unified-roles.ts

# Step 6: Create Super Admin (first time only)
npx tsx scripts/create-super-admin.ts

# Step 7: (Migration only) Run trading user import
# npx tsx scripts/migrate-trading-users.ts

# Step 8: Verify migration
npx tsx scripts/verify-migration.ts
```

---

## Build

```bash
# Build frontend (CRM + Trading + Admin UI)
npm run build

# Build backend server
npm run build:server

# Verify build output
ls -la dist/
```

---

## Testing Before Deploy

```bash
# TypeScript type check
npm run lint

# Unit tests (if configured)
npm test

# Integration tests (requires test DB)
npm run test:integration

# Smoke test against staging
npm run test:smoke -- --url https://staging.bullenhaus.com
```

---

## Deploy Steps

### Option A: Vercel (Recommended for frontend + serverless backend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Ensure all env vars are set in Vercel Dashboard → Settings → Environment Variables.

### Option B: Self-hosted (Railway / Fly.io for backend)

```bash
# Backend: build Docker image
docker build -t bullenhaus-api .

# Push to registry
docker push registry/bullenhaus-api:latest

# Deploy via Railway CLI or Fly.io
railway up
# OR
flyctl deploy
```

Frontend: deploy dist/ to Vercel, Cloudflare Pages, or Nginx.

---

## Post-Deploy Verification

```bash
# 1. Health check
curl https://api.bullenhaus.com/health

# 2. Login as Super Admin
curl -X POST https://api.bullenhaus.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"$SUPER_ADMIN_EMAIL","password":"$SUPER_ADMIN_PASSWORD"}'

# 3. Verify CRM route guard (expect 403)
curl https://api.bullenhaus.com/api/v1/crm/clients \
  -H 'Authorization: Bearer <trading_user_token>'

# 4. Verify Trading route guard (expect 403)
curl https://api.bullenhaus.com/api/v1/trading/accounts \
  -H 'Authorization: Bearer <crm_user_token>'

# 5. Check audit log captured first login
curl https://api.bullenhaus.com/api/v1/admin/audit-log \
  -H 'Authorization: Bearer <super_admin_token>'

# 6. Verify Worker health
curl https://api.bullenhaus.com/api/v1/internal/health \
  -H 'X-API-Key: $WORKER_API_KEY'
```

Post-deploy checklist:

- [ ] `GET /health` returns `{ status: 'ok' }`
- [ ] Super Admin can log in and reach `/admin/dashboard`
- [ ] CRM user can log in and reach `/crm/dashboard`
- [ ] CRM user is blocked from `/trade/*` (redirected to login or 403)
- [ ] Trading user can log in and reach `/trade/dashboard`
- [ ] Trading user is blocked from `/crm/*`
- [ ] Worker processes test event successfully
- [ ] No `.env` values visible in frontend bundle (`strings dist/assets/*.js | grep "KEY"`)
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS only allows allowed origins
- [ ] Supabase service role key not present in frontend bundle
- [ ] Rate limiting active on `/api/v1/auth/login`
- [ ] Audit log has login events

---

## Rollback Procedure

```bash
# Frontend rollback: Vercel dashboard → Deployments → select previous → Promote
# Backend rollback: redeploy previous Docker tag
docker pull registry/bullenhaus-api:previous-tag
docker run -d registry/bullenhaus-api:previous-tag

# Database rollback (if needed):
psql $DIRECT_URL -f supabase/migrations/rollback/003_rls_rollback.sql
npx prisma migrate resolve --rolled-back <migration-name>
```

Total estimated rollback time: **< 15 minutes**
