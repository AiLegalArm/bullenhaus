-- Migration: 001_add_unified_columns
-- Purpose:   Add systemRole and domain columns to existing User table.
--            Maps existing CRM roles to the unified role system.
-- Safe:      All changes are ADDITIVE (ADD COLUMN IF NOT EXISTS).
-- Rollback:  See rollback section at bottom.
-- Run via:   psql $DIRECT_URL -f supabase/migrations/001_add_unified_columns.sql

BEGIN;

-- -------------------------------------------------------
-- Step 1: Add new columns to User table
-- -------------------------------------------------------

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "systemRole"        TEXT NOT NULL DEFAULT 'CRM_AGENT',
  ADD COLUMN IF NOT EXISTS "domain"            TEXT NOT NULL DEFAULT 'CRM',
  ADD COLUMN IF NOT EXISTS "tradingExternalId" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerified"     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "mfaEnabled"        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "mfaSecret"         TEXT,
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil"       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "tradingAccountId"  UUID;

-- Unique constraint on tradingExternalId (ignore if already exists)
DO $$
BEGIN
  BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_tradingExternalId_key"
      UNIQUE ("tradingExternalId");
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END$$;

-- -------------------------------------------------------
-- Step 2: Map existing CRM roles to unified systemRole values
--
-- Assumes the existing schema has UserRole → Role tables (Aura CRM).
-- If the schema is different, adjust the JOIN accordingly.
-- -------------------------------------------------------

UPDATE "User" u
SET
  "systemRole" = CASE r.name
    WHEN 'ADMIN'    THEN 'CRM_ADMIN'
    WHEN 'DIRECTOR' THEN 'CRM_DIRECTOR'
    WHEN 'MANAGER'  THEN 'CRM_MANAGER'
    WHEN 'AGENT'    THEN 'CRM_AGENT'
    ELSE 'CRM_AGENT'
  END,
  "domain" = 'CRM'
FROM "UserRole" ur
JOIN "Role" r ON r.id = ur."roleId"
WHERE ur."userId" = u.id
  AND u."systemRole" = 'CRM_AGENT'; -- Only update rows not yet migrated

-- -------------------------------------------------------
-- Step 3: Add indexes for frequent queries
-- -------------------------------------------------------

CREATE INDEX IF NOT EXISTS "User_systemRole_domain_idx"
  ON "User" ("systemRole", "domain");

CREATE INDEX IF NOT EXISTS "User_email_idx"
  ON "User" (email);

CREATE INDEX IF NOT EXISTS "User_status_idx"
  ON "User" (status)
  WHERE status IS NOT NULL;

-- -------------------------------------------------------
-- Step 4: Create DenylistedToken table (JWT revocation)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DenylistedToken" (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jti         TEXT        NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DenylistedToken_expiresAt_idx"
  ON "DenylistedToken" ("expiresAt");

-- -------------------------------------------------------
-- Step 5: Add RefreshToken family column (if not present)
-- -------------------------------------------------------

ALTER TABLE "RefreshToken"
  ADD COLUMN IF NOT EXISTS family TEXT;

COMMIT;

-- -------------------------------------------------------
-- ROLLBACK (run manually if needed):
-- -------------------------------------------------------
-- BEGIN;
-- ALTER TABLE "User"
--   DROP COLUMN IF EXISTS "systemRole",
--   DROP COLUMN IF EXISTS "domain",
--   DROP COLUMN IF EXISTS "tradingExternalId",
--   DROP COLUMN IF EXISTS "emailVerified",
--   DROP COLUMN IF EXISTS "mfaEnabled",
--   DROP COLUMN IF EXISTS "mfaSecret",
--   DROP COLUMN IF EXISTS "failedLoginAttempts",
--   DROP COLUMN IF EXISTS "lockedUntil",
--   DROP COLUMN IF EXISTS "tradingAccountId";
-- DROP TABLE IF EXISTS "DenylistedToken";
-- COMMIT;
