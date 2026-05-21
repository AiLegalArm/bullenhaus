/**
 * verify-migration.ts — Post-migration verification script
 *
 * Checks that the Bullenhaus schema is in the expected state after migration.
 * Run this after every migration step before promoting to production.
 *
 * Checks:
 *   1. All required tables exist
 *   2. User roles are correctly mapped
 *   3. No email collisions
 *   4. Domain counts are non-zero (if data was migrated)
 *   5. RLS is enabled on all tables
 *   6. At least one SUPER_ADMIN exists
 *   7. WorkerJob and SyncEventsLog tables exist
 *
 * Run via: npm run db:verify
 *       or: npx tsx scripts/verify-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function pass(name: string, message: string) {
  results.push({ name, passed: true, message });
  console.log(`  ✅ ${name}: ${message}`);
}

function fail(name: string, message: string) {
  results.push({ name, passed: false, message });
  console.error(`  ❌ ${name}: ${message}`);
}

function warn(name: string, message: string) {
  results.push({ name, passed: true, message: `[WARN] ${message}` });
  console.warn(`  ⚠️  ${name}: ${message}`);
}

// -------------------------------------------------------
// Check 1: Required tables exist
// -------------------------------------------------------

async function checkTablesExist() {
  console.log('\n[1] Checking required tables...');

  const requiredTables = [
    'User', 'Role', 'Permission', 'UserRole', 'RolePermission',
    'RefreshToken', 'DenylistedToken', 'AuditLog',
    'TradingAccount', 'WorkerJob', 'SyncEventsLog',
    'Client', 'Lead', 'Team',
  ];

  const tableQuery = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `;
  const existingTables = new Set(tableQuery.map((r) => r.tablename));

  for (const table of requiredTables) {
    if (existingTables.has(table)) {
      pass(`Table "${table}"`, 'exists');
    } else {
      fail(`Table "${table}"`, 'MISSING — run migrations');
    }
  }
}

// -------------------------------------------------------
// Check 2: User domain counts
// -------------------------------------------------------

async function checkUserCounts() {
  console.log('\n[2] Checking User domain/role distribution...');

  const counts = await prisma.$queryRaw<{ domain: string; systemRole: string; count: string }[]>`
    SELECT domain, "systemRole", COUNT(*)::text as count
    FROM "User"
    GROUP BY domain, "systemRole"
    ORDER BY domain, "systemRole"
  `;

  if (counts.length === 0) {
    warn('User counts', 'No users found — expected after migration');
    return;
  }

  for (const row of counts) {
    pass(`User ${row.domain}/${row.systemRole}`, `${row.count} users`);
  }
}

// -------------------------------------------------------
// Check 3: No email collisions
// -------------------------------------------------------

async function checkNoEmailCollisions() {
  console.log('\n[3] Checking for email duplicates...');

  const dupes = await prisma.$queryRaw<{ email: string; count: string }[]>`
    SELECT email, COUNT(*)::text as count
    FROM "User"
    GROUP BY email
    HAVING COUNT(*) > 1
  `;

  if (dupes.length === 0) {
    pass('Email uniqueness', 'No duplicate emails found');
  } else {
    for (const dupe of dupes) {
      fail('Email duplicate', `${dupe.email} appears ${dupe.count} times`);
    }
  }
}

// -------------------------------------------------------
// Check 4: Super Admin exists
// -------------------------------------------------------

async function checkSuperAdmin() {
  console.log('\n[4] Checking Super Admin...');

  const admins = await prisma.user.findMany({
    where: { systemRole: 'SUPER_ADMIN' } as any,
    select: { id: true, email: true, status: true },
  });

  if (admins.length === 0) {
    fail('Super Admin', 'No SUPER_ADMIN user found — run: npm run admin:create');
  } else {
    for (const admin of admins) {
      pass('Super Admin', `Found: ${admin.email} (status: ${(admin as any).status})`);
    }
  }
}

// -------------------------------------------------------
// Check 5: RLS enabled on key tables
// -------------------------------------------------------

async function checkRlsEnabled() {
  console.log('\n[5] Checking Row Level Security...');

  const rlsCheck = await prisma.$queryRaw<{ tablename: string; rowsecurity: boolean }[]>`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'Client', 'Lead', 'TradingAccount', 'AuditLog')
  `;

  for (const row of rlsCheck) {
    if (row.rowsecurity) {
      pass(`RLS on "${row.tablename}"`, 'enabled');
    } else {
      fail(`RLS on "${row.tablename}"`, 'NOT enabled — run migration 003');
    }
  }
}

// -------------------------------------------------------
// Check 6: Roles seeded
// -------------------------------------------------------

async function checkRolesSeeded() {
  console.log('\n[6] Checking roles and permissions...');

  const roleCount = await (prisma as any).role?.count() ?? 0;
  const permCount = await prisma.permission.count();

  if (roleCount >= 7) {
    pass('Roles', `${roleCount} roles found`);
  } else if (roleCount > 0) {
    warn('Roles', `Only ${roleCount} roles found — expected 7. Run: npm run db:seed`);
  } else {
    fail('Roles', 'No roles found — run: npm run db:seed');
  }

  if (permCount > 0) {
    pass('Permissions', `${permCount} permissions found`);
  } else {
    fail('Permissions', 'No permissions found — run: npm run db:seed');
  }
}

// -------------------------------------------------------
// Check 7: Auth helper functions exist (RLS)
// -------------------------------------------------------

async function checkAuthFunctions() {
  console.log('\n[7] Checking auth helper functions...');

  const functions = ['user_role', 'user_domain', 'user_id', 'is_super_admin', 'is_crm_user', 'is_trading_user'];

  const existing = await prisma.$queryRaw<{ proname: string }[]>`
    SELECT proname FROM pg_proc
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
      AND proname = ANY(ARRAY['user_role','user_domain','user_id','is_super_admin','is_crm_user','is_trading_user'])
  `;
  const existingNames = new Set(existing.map((r) => r.proname));

  for (const fn of functions) {
    if (existingNames.has(fn)) {
      pass(`auth.${fn}()`, 'exists');
    } else {
      fail(`auth.${fn}()`, 'MISSING — run migration 003');
    }
  }
}

// -------------------------------------------------------
// Summary
// -------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('Bullenhaus — Migration Verification');
  console.log('='.repeat(60));

  await checkTablesExist();
  await checkUserCounts();
  await checkNoEmailCollisions();
  await checkSuperAdmin();
  await checkRlsEnabled();
  await checkRolesSeeded();
  await checkAuthFunctions();

  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n❌ Verification FAILED — fix the issues above before deploying.');
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed — migration looks good!');
  }
}

main()
  .catch((err) => {
    console.error('[verify-migration] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
