-- Migration: 002_create_trading_tables
-- Purpose:   Create TradingAccount and related trading domain tables.
-- Safe:      CREATE TABLE IF NOT EXISTS — idempotent.
-- Rollback:  See rollback section at bottom.
-- Run via:   psql $DIRECT_URL -f supabase/migrations/002_create_trading_tables.sql

BEGIN;

-- -------------------------------------------------------
-- pgcrypto required for gen_random_uuid()
-- -------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------
-- TradingAccount — one per trading user
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS "TradingAccount" (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID        NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "crmClientId"   UUID        REFERENCES "Client"(id),
  "supabaseAuthId" TEXT       UNIQUE,      -- links to old Trade-V2 auth.users.id
  "kycStatus"     TEXT        NOT NULL DEFAULT 'UNVERIFIED'
                              CHECK ("kycStatus" IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  balance         DECIMAL(19,4) NOT NULL DEFAULT 0,
  "marginUsed"    DECIMAL(19,4) NOT NULL DEFAULT 0,
  currency        TEXT        NOT NULL DEFAULT 'USD',
  "isActive"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "TradingAccount_userId_key"
  ON "TradingAccount" ("userId");

CREATE INDEX IF NOT EXISTS "TradingAccount_crmClientId_idx"
  ON "TradingAccount" ("crmClientId")
  WHERE "crmClientId" IS NOT NULL;

-- -------------------------------------------------------
-- WorkerJob — background job queue
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS "WorkerJob" (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventType"     TEXT        NOT NULL,
  payload         TEXT        NOT NULL,   -- JSON
  "idempotencyKey" TEXT       NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','FAILED')),
  attempts        INTEGER     NOT NULL DEFAULT 0,
  "maxRetries"    INTEGER     NOT NULL DEFAULT 3,
  "lastError"     TEXT,
  "createdById"   UUID        REFERENCES "User"(id),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "WorkerJob_status_createdAt_idx"
  ON "WorkerJob" (status, "createdAt");

CREATE INDEX IF NOT EXISTS "WorkerJob_idempotencyKey_idx"
  ON "WorkerJob" ("idempotencyKey");

-- -------------------------------------------------------
-- Auto-update updatedAt trigger
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TradingAccount trigger
DROP TRIGGER IF EXISTS "TradingAccount_updatedAt" ON "TradingAccount";
CREATE TRIGGER "TradingAccount_updatedAt"
  BEFORE UPDATE ON "TradingAccount"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WorkerJob trigger
DROP TRIGGER IF EXISTS "WorkerJob_updatedAt" ON "WorkerJob";
CREATE TRIGGER "WorkerJob_updatedAt"
  BEFORE UPDATE ON "WorkerJob"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- SyncEventsLog — for CRM<->Trading webhook idempotency
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS "SyncEventsLog" (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId"       TEXT        NOT NULL UNIQUE,
  "eventType"     TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','FAILED')),
  payload         TEXT        NOT NULL,   -- JSON
  "responseData"  TEXT,                  -- JSON
  "retryCount"    INTEGER     NOT NULL DEFAULT 0,
  "processedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SyncEventsLog_status_idx"
  ON "SyncEventsLog" (status);

COMMIT;

-- -------------------------------------------------------
-- ROLLBACK (run manually if needed):
-- -------------------------------------------------------
-- BEGIN;
-- DROP TABLE IF EXISTS "SyncEventsLog";
-- DROP TABLE IF EXISTS "WorkerJob";
-- DROP TABLE IF EXISTS "TradingAccount";
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- COMMIT;
