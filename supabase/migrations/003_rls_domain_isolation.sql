-- Migration: 003_rls_domain_isolation
-- Purpose:   Enable Row Level Security and create domain isolation policies.
--            CRM users CANNOT read Trading tables.
--            Trading users CANNOT read CRM tables.
--            Super Admin can read everything.
--            AuditLog is IMMUTABLE — no UPDATE or DELETE for any role.
-- Safe:      Policies use CREATE POLICY IF NOT EXISTS pattern (DROP then recreate).
-- Rollback:  See rollback section at bottom.
-- Run via:   psql $DIRECT_URL -f supabase/migrations/003_rls_domain_isolation.sql

BEGIN;

-- -------------------------------------------------------
-- Helper functions (read JWT claims set by auth middleware)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', TRUE)::json->>'systemRole',
    ''
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_domain()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', TRUE)::json->>'domain',
    ''
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', TRUE)::json->>'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'SUPER_ADMIN';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_crm_user()
RETURNS BOOLEAN AS $$
  SELECT auth.user_domain() IN ('CRM', 'BOTH');
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_trading_user()
RETURNS BOOLEAN AS $$
  SELECT auth.user_domain() IN ('TRADING', 'BOTH');
$$ LANGUAGE SQL STABLE;

-- -------------------------------------------------------
-- User table RLS
-- -------------------------------------------------------

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User_select" ON "User";
CREATE POLICY "User_select" ON "User" FOR SELECT
  USING (
    auth.is_super_admin()
    OR id = auth.user_id()
    OR (auth.is_crm_user() AND domain IN ('CRM', 'BOTH'))
    OR (auth.is_trading_user() AND domain IN ('TRADING', 'BOTH'))
  );

DROP POLICY IF EXISTS "User_insert" ON "User";
CREATE POLICY "User_insert" ON "User" FOR INSERT
  WITH CHECK (
    auth.is_super_admin()
    OR auth.user_role() IN ('CRM_ADMIN')
  );

DROP POLICY IF EXISTS "User_update" ON "User";
CREATE POLICY "User_update" ON "User" FOR UPDATE
  USING (
    auth.is_super_admin()
    OR id = auth.user_id()
    OR (auth.user_role() = 'CRM_ADMIN' AND domain = 'CRM')
  );

DROP POLICY IF EXISTS "User_delete" ON "User";
CREATE POLICY "User_delete" ON "User" FOR DELETE
  USING (auth.is_super_admin());

-- -------------------------------------------------------
-- Client table RLS (CRM domain only)
-- -------------------------------------------------------

ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client_select" ON "Client";
CREATE POLICY "Client_select" ON "Client" FOR SELECT
  USING (
    auth.is_super_admin()
    OR (
      auth.is_crm_user()
      AND (
        auth.user_role() IN ('CRM_ADMIN', 'CRM_DIRECTOR')  -- see all
        OR (auth.user_role() = 'CRM_MANAGER')               -- TODO: team scope
        OR (auth.user_role() = 'CRM_AGENT' AND "assignedAgentId" = auth.user_id())
      )
    )
    -- Trading users: NO access
  );

DROP POLICY IF EXISTS "Client_insert" ON "Client";
CREATE POLICY "Client_insert" ON "Client" FOR INSERT
  WITH CHECK (
    auth.is_super_admin()
    OR auth.is_crm_user()
  );

DROP POLICY IF EXISTS "Client_update" ON "Client";
CREATE POLICY "Client_update" ON "Client" FOR UPDATE
  USING (
    auth.is_super_admin()
    OR (
      auth.is_crm_user()
      AND (
        auth.user_role() IN ('CRM_ADMIN', 'CRM_DIRECTOR')
        OR (auth.user_role() = 'CRM_AGENT' AND "assignedAgentId" = auth.user_id())
      )
    )
  );

DROP POLICY IF EXISTS "Client_delete" ON "Client";
CREATE POLICY "Client_delete" ON "Client" FOR DELETE
  USING (
    auth.is_super_admin()
    OR auth.user_role() = 'CRM_ADMIN'
  );

-- -------------------------------------------------------
-- Lead table RLS (CRM domain only)
-- -------------------------------------------------------

ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lead_select" ON "Lead";
CREATE POLICY "Lead_select" ON "Lead" FOR SELECT
  USING (
    auth.is_super_admin()
    OR (
      auth.is_crm_user()
      AND (
        auth.user_role() IN ('CRM_ADMIN', 'CRM_DIRECTOR')
        OR (auth.user_role() = 'CRM_AGENT' AND "assignedAgentId" = auth.user_id())
      )
    )
  );

DROP POLICY IF EXISTS "Lead_insert" ON "Lead";
CREATE POLICY "Lead_insert" ON "Lead" FOR INSERT
  WITH CHECK (auth.is_super_admin() OR auth.is_crm_user());

DROP POLICY IF EXISTS "Lead_update" ON "Lead";
CREATE POLICY "Lead_update" ON "Lead" FOR UPDATE
  USING (auth.is_super_admin() OR auth.is_crm_user());

DROP POLICY IF EXISTS "Lead_delete" ON "Lead";
CREATE POLICY "Lead_delete" ON "Lead" FOR DELETE
  USING (auth.is_super_admin() OR auth.user_role() = 'CRM_ADMIN');

-- -------------------------------------------------------
-- TradingAccount table RLS (Trading domain only)
-- -------------------------------------------------------

ALTER TABLE "TradingAccount" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "TradingAccount_select" ON "TradingAccount";
CREATE POLICY "TradingAccount_select" ON "TradingAccount" FOR SELECT
  USING (
    auth.is_super_admin()
    OR (auth.user_role() = 'TRADING_OPERATOR')           -- sees all
    OR (auth.user_role() = 'TRADER' AND "userId" = auth.user_id())  -- own only
    -- CRM users: NO access
  );

DROP POLICY IF EXISTS "TradingAccount_insert" ON "TradingAccount";
CREATE POLICY "TradingAccount_insert" ON "TradingAccount" FOR INSERT
  WITH CHECK (
    auth.is_super_admin()
    OR auth.user_role() = 'TRADING_OPERATOR'
  );

DROP POLICY IF EXISTS "TradingAccount_update" ON "TradingAccount";
CREATE POLICY "TradingAccount_update" ON "TradingAccount" FOR UPDATE
  USING (
    auth.is_super_admin()
    OR auth.user_role() = 'TRADING_OPERATOR'
  );

DROP POLICY IF EXISTS "TradingAccount_delete" ON "TradingAccount";
CREATE POLICY "TradingAccount_delete" ON "TradingAccount" FOR DELETE
  USING (auth.is_super_admin());

-- -------------------------------------------------------
-- AuditLog — IMMUTABLE (SELECT only for authorized roles)
-- -------------------------------------------------------

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AuditLog_select" ON "AuditLog";
CREATE POLICY "AuditLog_select" ON "AuditLog" FOR SELECT
  USING (
    auth.is_super_admin()
    OR (auth.is_crm_user() AND auth.user_role() IN ('CRM_ADMIN', 'CRM_DIRECTOR'))
    OR (auth.user_role() = 'TRADING_OPERATOR')
  );

-- NO INSERT policy for regular users (worker_service uses service_role which bypasses RLS)
-- NO UPDATE policy — audit logs are immutable
-- NO DELETE policy — audit logs are immutable

-- -------------------------------------------------------
-- WorkerJob — worker_service only (service_role bypasses RLS)
-- -------------------------------------------------------

ALTER TABLE "WorkerJob" ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (worker) can access

-- -------------------------------------------------------
-- DenylistedToken — server-side only
-- -------------------------------------------------------

ALTER TABLE "DenylistedToken" ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role can access

-- -------------------------------------------------------
-- SyncEventsLog — server-side only
-- -------------------------------------------------------

ALTER TABLE "SyncEventsLog" ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role can access

-- -------------------------------------------------------
-- GRANT permissions to authenticated and anon roles
-- -------------------------------------------------------

-- authenticated role (regular users with JWT)
GRANT SELECT, INSERT, UPDATE ON "User"           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Client" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Lead"   TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "TradingAccount" TO authenticated;
GRANT SELECT ON "AuditLog"                       TO authenticated;
GRANT SELECT, INSERT ON "RefreshToken"           TO authenticated;
GRANT DELETE ON "RefreshToken"                   TO authenticated;

-- service_role bypasses RLS — used by worker and migrations
-- No explicit GRANT needed; Supabase service_role has superuser-level access

COMMIT;

-- -------------------------------------------------------
-- ROLLBACK (run manually if needed):
-- -------------------------------------------------------
-- BEGIN;
-- ALTER TABLE "User"           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Client"         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Lead"           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "TradingAccount" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AuditLog"       DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "User_select"           ON "User";
-- DROP POLICY IF EXISTS "User_insert"           ON "User";
-- DROP POLICY IF EXISTS "User_update"           ON "User";
-- DROP POLICY IF EXISTS "User_delete"           ON "User";
-- DROP POLICY IF EXISTS "Client_select"         ON "Client";
-- -- ... repeat for all policies ...
-- DROP FUNCTION IF EXISTS auth.user_role();
-- DROP FUNCTION IF EXISTS auth.user_domain();
-- DROP FUNCTION IF EXISTS auth.user_id();
-- DROP FUNCTION IF EXISTS auth.is_super_admin();
-- DROP FUNCTION IF EXISTS auth.is_crm_user();
-- DROP FUNCTION IF EXISTS auth.is_trading_user();
-- COMMIT;
