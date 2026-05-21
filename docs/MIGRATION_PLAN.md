# Bullenhaus — Migration Plan

## Overview

This document describes how to migrate from two separate platforms (Trade-V2 + Aura CRM) to the unified Bullenhaus system without data loss or downtime.

**Golden rules:**
- No DROP or DELETE on existing tables until post-migration verification is complete
- All migrations are additive (add columns/tables) — destructive changes only in cleanup phase
- Every step has a rollback note
- Run on staging first, verify, then production

---

## Phase 1 — Schema Migration

### Step 1.1 — Add unified columns to User table (CRM DB)

The CRM already has a `User` table managed by Prisma. We add:
- `systemRole` — enum for the unified role system
- `domain` — enum `CRM | TRADING | BOTH`
- `tradingExternalId` — link to Trade-V2 Supabase user UUID

```sql
-- Migration: 001_add_unified_columns_to_user
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "systemRole"       TEXT NOT NULL DEFAULT 'CRM_AGENT',
  ADD COLUMN IF NOT EXISTS "domain"           TEXT NOT NULL DEFAULT 'CRM',
  ADD COLUMN IF NOT EXISTS "tradingExternalId" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "emailVerified"    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "mfaEnabled"       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "mfaSecret"        TEXT;

-- Rollback note: ALTER TABLE "User" DROP COLUMN IF EXISTS "systemRole", "domain", etc.
```

### Step 1.2 — Map existing CRM roles to systemRole

```sql
-- Map CRM role names to new systemRole values
UPDATE "User" u
SET "systemRole" = ur_mapped."newRole",
    "domain"     = 'CRM'
FROM (
  SELECT u2.id,
    CASE
      WHEN r.name = 'ADMIN'    THEN 'CRM_ADMIN'
      WHEN r.name = 'DIRECTOR' THEN 'CRM_DIRECTOR'
      WHEN r.name = 'MANAGER'  THEN 'CRM_MANAGER'
      WHEN r.name = 'AGENT'    THEN 'CRM_AGENT'
      ELSE 'CRM_AGENT'
    END AS "newRole"
  FROM "User" u2
  JOIN "UserRole" ur  ON ur."userId" = u2.id
  JOIN "Role"    r    ON r.id = ur."roleId"
) ur_mapped
WHERE u.id = ur_mapped.id;
```

### Step 1.3 — Create TradingAccount table

```sql
-- Migration: 002_create_trading_tables
CREATE TABLE IF NOT EXISTS "TradingAccount" (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "crmClientId"     UUID REFERENCES "Client"(id),
  "supabaseAuthId"  TEXT UNIQUE, -- links to old Trade-V2 auth.users.id
  "kycStatus"       TEXT NOT NULL DEFAULT 'UNVERIFIED',
  "balance"         DECIMAL(19,4) NOT NULL DEFAULT 0,
  "marginUsed"      DECIMAL(19,4) NOT NULL DEFAULT 0,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Step 1.4 — Run Bullenhaus seed for unified roles

```bash
npx tsx prisma/seed-unified-roles.ts
```

This creates the 7 system roles + all permissions in the Role/Permission tables.

### Step 1.5 — Apply RLS policies

```bash
# Apply migration SQL via Supabase CLI or psql
psql $DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql
```

---

## Phase 2 — User Migration

### Step 2.1 — Export existing Trade-V2 users

Trade-V2 uses Supabase Auth (`auth.users`) + a `public.users` table with columns:
`id, email, display_name, role (LITE|PRO|ADMIN), kyc_status, created_at, updated_at`

Export via Supabase Dashboard → SQL Editor:
```sql
SELECT id, email, display_name, role, kyc_status, created_at
FROM public.users
ORDER BY created_at;
```

Save as `migration/trading_users_export.csv`

### Step 2.2 — Create Bullenhaus User records for Trading users

For each exported trading user, create a `User` record in the unified DB:

```typescript
// scripts/migrate-trading-users.ts
// TODO: Adjust email collision handling before running
import { prisma } from '../src/server/prisma/prisma.service';
import { hashPassword } from '../src/server/utils/password.util';
import fs from 'fs';
import csv from 'csv-parse/sync';

const rows = csv.parse(fs.readFileSync('migration/trading_users_export.csv'), { columns: true });

for (const row of rows) {
  const mapRole = (r: string) => r === 'ADMIN' ? 'TRADING_OPERATOR' : 'TRADER';

  await prisma.user.upsert({
    where:  { email: row.email },
    update: { tradingExternalId: row.id },
    create: {
      email:             row.email,
      passwordHash:      'MIGRATION_PLACEHOLDER', // user must reset password
      firstName:         (row.display_name || '').split(' ')[0] || 'User',
      lastName:          (row.display_name || '').split(' ').slice(1).join(' ') || '',
      systemRole:        mapRole(row.role),
      domain:            'TRADING',
      tradingExternalId: row.id,
      emailVerified:     true,
      status:            'ACTIVE',
    },
  });
}
```

**IMPORTANT:** After migration, trigger password reset emails for all migrated trading users so they can set a new password in the unified system.

### Step 2.3 — Verify user counts

```sql
SELECT domain, "systemRole", COUNT(*) 
FROM "User" 
GROUP BY domain, "systemRole"
ORDER BY domain, "systemRole";
```

Expected:
- CRM users: ADMIN/DIRECTOR/MANAGER/AGENT counts match old CRM seed
- Trading users: TRADING_OPERATOR/TRADER counts match Trade-V2 export

---

## Phase 3 — Data Migration

### Step 3.1 — Trading data

Trade-V2 stores trading data in Supabase directly (`wallets`, `positions`, `orders`, etc.).

**Option A (Recommended):** Keep existing Supabase tables for trading data; add foreign key references to new `TradingAccount.id`.

**Option B:** Export and re-import via Prisma models.

```sql
-- Link existing Supabase trading data to new TradingAccount
UPDATE "TradingAccount" ta
SET "supabaseAuthId" = pu.id::text
FROM public_users_export pu -- temp import of old trade users
WHERE ta.email = pu.email;
```

### Step 3.2 — CRM data (no migration needed)

CRM data (clients, leads, calls, etc.) already lives in the PostgreSQL database that Prisma manages. No migration needed — just add RLS policies.

### Step 3.3 — Sync event log

Existing `SyncEventsLog` entries from the webhook pipeline remain intact. The worker will continue processing any pending events.

---

## Phase 4 — Staging Verification

Checklist before promoting to production:

- [ ] All CRM users can log in with old passwords
- [ ] All CRM users are redirected to `/crm/dashboard`
- [ ] CRM users cannot access `/trade/*` routes
- [ ] CRM users cannot query Trading tables via direct API
- [ ] All Trading users can log in (after password reset flow)
- [ ] Trading users are redirected to `/trade/dashboard`
- [ ] Trading users cannot access `/crm/*` routes
- [ ] Super Admin can access both `/crm/*` and `/trade/*`
- [ ] RLS policies block cross-domain table reads (test with direct Supabase queries)
- [ ] Worker processes a test sync event
- [ ] Audit log captures login, role changes, data exports

---

## Phase 5 — Production Cutover

1. **Maintenance window:** Schedule 30–60 min window
2. **Put old systems in read-only mode** (disable writes via env flag or nginx block)
3. **Final data export** from Trade-V2 (any new users since staging export)
4. **Run incremental user migration** (only new rows since step 2.2)
5. **Deploy Bullenhaus backend** to production
6. **Deploy Bullenhaus frontend** to production
7. **Update DNS** (or Vercel project config) to point to new deployments
8. **Verify** all smoke tests pass (see TEST_PLAN.md)
9. **Remove maintenance window**

---

## Rollback Plan

| Step | Rollback Action | Time Estimate |
|---|---|---|
| Schema migration | Run rollback SQL (DROP COLUMN / DROP TABLE IF EXISTS) | 5 min |
| User migration | DELETE FROM "User" WHERE "tradingExternalId" IS NOT NULL | 2 min |
| Role mapping | UPDATE "User" SET "systemRole" = 'CRM_AGENT', "domain" = 'CRM' | 1 min |
| Frontend deploy | Redeploy previous Vercel deployment (1 click) | 2 min |
| Backend deploy | Redeploy previous Docker/Railway deployment | 3 min |
| Full rollback | Revert DNS to old deployments | 2 min |

**Total rollback time: ~15 minutes**

---

## TODO / Open Questions

1. **TODO:** Confirm whether Trade-V2 trading data tables (`wallets`, `positions`, `orders`) will be migrated to Prisma or kept as Supabase-native tables.
2. **TODO:** Confirm password reset mechanism for migrated trading users (email provider required).
3. **TODO:** Confirm if any Trade-V2 users have the same email as a CRM user — collision resolution needed.
4. **TODO:** Confirm Redis availability for JWT denylist, or switch to DB-backed `DenylistedToken` table.
5. **RISK:** Trade-V2 uses `LITE | PRO | ADMIN | STUDENT | INSTRUCTOR` roles. `STUDENT` and `INSTRUCTOR` have no direct mapping. Map to `TRADER` for now — verify with business.
