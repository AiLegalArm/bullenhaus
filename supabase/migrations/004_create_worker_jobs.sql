-- Migration: 004_create_worker_jobs
-- Purpose:   Additional indexes and housekeeping setup for the worker job queue.
--            Also creates the cleanup job schedule stub.
-- Safe:      Additive only.
-- Rollback:  See rollback section at bottom.
-- Run via:   psql $DIRECT_URL -f supabase/migrations/004_create_worker_jobs.sql
--
-- Note: WorkerJob and SyncEventsLog tables are created in 002_create_trading_tables.sql
--       This migration adds supplementary configuration.

BEGIN;

-- -------------------------------------------------------
-- Index: find failed jobs for retry dashboard
-- -------------------------------------------------------

CREATE INDEX IF NOT EXISTS "WorkerJob_failed_idx"
  ON "WorkerJob" (status, "updatedAt")
  WHERE status = 'FAILED';

-- -------------------------------------------------------
-- Index: clean up completed jobs older than N days
-- -------------------------------------------------------

CREATE INDEX IF NOT EXISTS "WorkerJob_completed_createdAt_idx"
  ON "WorkerJob" ("createdAt")
  WHERE status = 'COMPLETED';

-- -------------------------------------------------------
-- Function: cleanup old completed/failed worker jobs
-- Call this on a schedule (e.g. daily via pg_cron or the worker itself).
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION cleanup_old_worker_jobs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "WorkerJob"
  WHERE status IN ('COMPLETED', 'FAILED')
    AND "createdAt" < NOW() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- Function: cleanup expired denylist tokens
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION cleanup_expired_denylist_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "DenylistedToken"
  WHERE "expiresAt" < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- Function: cleanup expired refresh tokens
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "RefreshToken"
  WHERE "expiresAt" < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- View: Worker queue status (for admin monitoring)
-- -------------------------------------------------------

CREATE OR REPLACE VIEW "WorkerJobStatusView" AS
SELECT
  status,
  "eventType",
  COUNT(*) AS job_count,
  MIN("createdAt") AS oldest_job,
  MAX("updatedAt") AS last_updated
FROM "WorkerJob"
GROUP BY status, "eventType"
ORDER BY status, "eventType";

GRANT SELECT ON "WorkerJobStatusView" TO authenticated;

COMMIT;

-- -------------------------------------------------------
-- ROLLBACK (run manually if needed):
-- -------------------------------------------------------
-- BEGIN;
-- DROP VIEW IF EXISTS "WorkerJobStatusView";
-- DROP FUNCTION IF EXISTS cleanup_old_worker_jobs(INTEGER);
-- DROP FUNCTION IF EXISTS cleanup_expired_denylist_tokens();
-- DROP FUNCTION IF EXISTS cleanup_expired_refresh_tokens();
-- DROP INDEX IF EXISTS "WorkerJob_failed_idx";
-- DROP INDEX IF EXISTS "WorkerJob_completed_createdAt_idx";
-- COMMIT;
