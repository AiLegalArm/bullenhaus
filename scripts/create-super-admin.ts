/**
 * create-super-admin.ts — Safe Super Admin creation script
 *
 * Creates the initial SUPER_ADMIN user from environment variables.
 * Safe to run on first deploy. Idempotent — will update if user exists.
 *
 * Requirements:
 *   Set in .env before running:
 *     SUPER_ADMIN_EMAIL=superadmin@yourdomain.com
 *     SUPER_ADMIN_PASSWORD=<strong-password-16+-chars>
 *     SUPER_ADMIN_FIRST_NAME=Super
 *     SUPER_ADMIN_LAST_NAME=Admin
 *
 * Run via: npm run admin:create
 *       or: npx tsx scripts/create-super-admin.ts
 *
 * Security:
 *   - Email and password are read from env ONLY — never hardcoded
 *   - Password is hashed with Argon2id before storage
 *   - Script exits with error if env vars are missing
 *   - No sensitive data is printed to stdout
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// -------------------------------------------------------
// Environment validation
// -------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[create-super-admin] Missing required env var: ${name}`);
    console.error('  Copy .env.example to .env and set SUPER_ADMIN_* values.');
    process.exit(1);
  }
  return value;
}

const SUPER_ADMIN_EMAIL     = requireEnv('SUPER_ADMIN_EMAIL');
const SUPER_ADMIN_PASSWORD  = requireEnv('SUPER_ADMIN_PASSWORD');
const SUPER_ADMIN_FIRST     = process.env['SUPER_ADMIN_FIRST_NAME'] ?? 'Super';
const SUPER_ADMIN_LAST      = process.env['SUPER_ADMIN_LAST_NAME']  ?? 'Admin';

if (SUPER_ADMIN_PASSWORD.length < 16) {
  console.error('[create-super-admin] SUPER_ADMIN_PASSWORD must be at least 16 characters.');
  process.exit(1);
}

// -------------------------------------------------------
// Password hashing — Argon2id preferred, bcrypt fallback
// -------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2');
    return argon2.hash(password, { type: (argon2 as any).argon2id });
  } catch {
    console.warn('[create-super-admin] argon2 not available, falling back to bcrypt');
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 14);
  }
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------

async function main() {
  console.log('[create-super-admin] Starting...');
  console.log(`[create-super-admin] Email: ${SUPER_ADMIN_EMAIL}`);

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
  });

  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

  if (existing) {
    console.log('[create-super-admin] User already exists — updating role and password...');

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        firstName: SUPER_ADMIN_FIRST,
        lastName:  SUPER_ADMIN_LAST,
        systemRole: 'SUPER_ADMIN',
        domain:     'BOTH',
        status:     'ACTIVE',
        emailVerified: true,
      } as any,
    });

    console.log('[create-super-admin] ✅ Super Admin updated successfully.');
  } else {
    console.log('[create-super-admin] Creating new Super Admin user...');

    const user = await prisma.user.create({
      data: {
        email:         SUPER_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        firstName:     SUPER_ADMIN_FIRST,
        lastName:      SUPER_ADMIN_LAST,
        systemRole:    'SUPER_ADMIN',
        domain:        'BOTH',
        status:        'ACTIVE',
        emailVerified: true,
      } as any,
    });

    // Assign the SUPER_ADMIN role record (links to Role table)
    try {
      const superAdminRole = await (prisma as any).role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });

      if (superAdminRole) {
        await (prisma as any).userRole.create({
          data: { userId: user.id, roleId: superAdminRole.id },
        });
        console.log('[create-super-admin] Role linked via UserRole table.');
      } else {
        console.warn('[create-super-admin] SUPER_ADMIN Role not found in DB — run db:seed first.');
      }
    } catch (err) {
      console.warn('[create-super-admin] Could not link role:', err);
    }

    // Write audit log
    try {
      await (prisma as any).auditLog?.create({
        data: {
          userId:     user.id,
          action:     'SUPER_ADMIN_CREATED',
          entityType: 'USER',
          entityId:   user.id,
          metadata:   JSON.stringify({ email: SUPER_ADMIN_EMAIL }),
        },
      });
    } catch {
      // Don't fail if audit log table doesn't exist yet
    }

    console.log('[create-super-admin] ✅ Super Admin created successfully.');
    console.log(`[create-super-admin] User ID: ${user.id}`);
  }

  console.log('[create-super-admin] Done. Login at /auth/login with your configured credentials.');
}

main()
  .catch((err) => {
    console.error('[create-super-admin] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
