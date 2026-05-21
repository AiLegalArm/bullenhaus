/**
 * seed-crm-staff.ts — CRM Staff Seed Script
 *
 * ⚠️  STAGING / DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION ⚠️
 *
 * Creates 15 CRM staff accounts (1 ADMIN, 2 DIRECTORs, 2 MANAGERs, 10 AGENTs)
 * for the aurelius-desk.crm domain.
 *
 * Security:
 *   - All passwords are hashed with Argon2id before storage
 *   - Plaintext passwords are never written to disk or printed to stdout
 *   - Upsert pattern — safe to re-run (idempotent)
 *
 * ⚠️  These are shared team credentials for the staging environment.
 *     Each team member should be issued a unique personal password
 *     and MFA before any production use.
 *
 * Run via: npm run db:seed:crm
 *       or: npx tsx prisma/seed-crm-staff.ts
 *
 * Prerequisites:
 *   1. Run migrations: npm run db:migrate
 *   2. Run role seed: npm run db:seed
 *   3. Set DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// -------------------------------------------------------
// Guard: refuse to run in production
// -------------------------------------------------------

if (process.env['NODE_ENV'] === 'production') {
  console.error('[seed-crm-staff] ❌ Refusing to run in NODE_ENV=production.');
  console.error('  This script is for staging/development only.');
  process.exit(1);
}

// -------------------------------------------------------
// Staff roster
// -------------------------------------------------------

type CrmSystemRole = 'CRM_ADMIN' | 'CRM_DIRECTOR' | 'CRM_MANAGER' | 'CRM_AGENT';

interface CrmStaff {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  systemRole: CrmSystemRole;
}

const CRM_STAFF: CrmStaff[] = [
  // ── ADMIN ──────────────────────────────────────────────────────────────────
  {
    email:      'orion.voss@aurelius-desk.crm',
    password:   'Ori@M16qvDs!509ss',
    firstName:  'Orion',
    lastName:   'Voss',
    systemRole: 'CRM_ADMIN',
  },

  // ── DIRECTORS ──────────────────────────────────────────────────────────────
  {
    email:      'selene.marwick@aurelius-desk.crm',
    password:   'Sel@wmq99L4!341ck',
    firstName:  'Selene',
    lastName:   'Marwick',
    systemRole: 'CRM_DIRECTOR',
  },
  {
    email:      'damian.rye@aurelius-desk.crm',
    password:   'Dam@I9stluA!955ye',
    firstName:  'Damian',
    lastName:   'Rye',
    systemRole: 'CRM_DIRECTOR',
  },

  // ── MANAGERS ───────────────────────────────────────────────────────────────
  {
    email:      'nora.valen@aurelius-desk.crm',
    password:   'Nor@XIS3oKo!808en',
    firstName:  'Nora',
    lastName:   'Valen',
    systemRole: 'CRM_MANAGER',
  },
  {
    email:      'kaspar.elian@aurelius-desk.crm',
    password:   'Kas@8QQl1iw!214an',
    firstName:  'Kaspar',
    lastName:   'Elian',
    systemRole: 'CRM_MANAGER',
  },

  // ── AGENTS ─────────────────────────────────────────────────────────────────
  {
    email:      'mira.sable@aurelius-desk.crm',
    password:   'Mir@NAPrO48!360le',
    firstName:  'Mira',
    lastName:   'Sable',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'levin.cross@aurelius-desk.crm',
    password:   'Lev@62ymJck!965ss',
    firstName:  'Levin',
    lastName:   'Cross',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'aria.novak@aurelius-desk.crm',
    password:   'Ari@T5a-aeE!568ak',
    firstName:  'Aria',
    lastName:   'Novak',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'theo.marek@aurelius-desk.crm',
    password:   'The@xrZGk9o!740ek',
    firstName:  'Theo',
    lastName:   'Marek',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'ivana.reed@aurelius-desk.crm',
    password:   'Iva@ZkN60CQ!511ed',
    firstName:  'Ivana',
    lastName:   'Reed',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'roman.kade@aurelius-desk.crm',
    password:   'Rom@7XWMmfM!906de',
    firstName:  'Roman',
    lastName:   'Kade',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'elara.finch@aurelius-desk.crm',
    password:   'Ela@2mxkUBk!150ch',
    firstName:  'Elara',
    lastName:   'Finch',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'milan.torr@aurelius-desk.crm',
    password:   'Mil@5_1urAE!438rr',
    firstName:  'Milan',
    lastName:   'Torr',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'vera.lyon@aurelius-desk.crm',
    password:   'Ver@9jt1gtw!281on',
    firstName:  'Vera',
    lastName:   'Lyon',
    systemRole: 'CRM_AGENT',
  },
  {
    email:      'soren.black@aurelius-desk.crm',
    password:   'Sor@t8aDkDI!323ck',
    firstName:  'Soren',
    lastName:   'Black',
    systemRole: 'CRM_AGENT',
  },
];

// -------------------------------------------------------
// Password hashing — Argon2id preferred, bcrypt fallback
// -------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2');
    return argon2.hash(password, { type: (argon2 as any).argon2id });
  } catch {
    console.warn('[seed-crm-staff] argon2 not available, falling back to bcrypt');
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 12);
  }
}

// -------------------------------------------------------
// Main
// -------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('Bullenhaus — CRM Staff Seed (STAGING ONLY)');
  console.log('='.repeat(60));
  console.log(`[seed-crm-staff] Seeding ${CRM_STAFF.length} CRM staff accounts...`);
  console.log('');

  // Pre-load all role records for efficient lookup
  const roles = await (prisma as any).role.findMany({
    where: {
      name: { in: ['CRM_ADMIN', 'CRM_DIRECTOR', 'CRM_MANAGER', 'CRM_AGENT'] },
    },
  }) as Array<{ id: string; name: string }>;

  const roleMap = new Map<string, string>(roles.map((r) => [r.name, r.id]));

  const missingRoles = ['CRM_ADMIN', 'CRM_DIRECTOR', 'CRM_MANAGER', 'CRM_AGENT'].filter(
    (r) => !roleMap.has(r)
  );

  if (missingRoles.length > 0) {
    console.error('[seed-crm-staff] ❌ Missing roles in DB:', missingRoles.join(', '));
    console.error('  Run: npm run db:seed   (seed-unified-roles first)');
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let errors  = 0;

  for (const staff of CRM_STAFF) {
    try {
      process.stdout.write(`  → ${staff.email} (${staff.systemRole})... `);

      const passwordHash = await hashPassword(staff.password);

      // Upsert user
      const existing = await prisma.user.findUnique({
        where: { email: staff.email.toLowerCase() },
      });

      let userId: string;

      if (existing) {
        // Update existing user — refresh password hash and ensure correct role/domain
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            firstName:     staff.firstName,
            lastName:      staff.lastName,
            systemRole:    staff.systemRole as any,
            domain:        'CRM' as any,
            status:        'ACTIVE' as any,
            emailVerified: true,
          } as any,
        });
        userId = existing.id;
        updated++;
        process.stdout.write('updated\n');
      } else {
        // Create new user
        const user = await prisma.user.create({
          data: {
            email:         staff.email.toLowerCase(),
            passwordHash,
            firstName:     staff.firstName,
            lastName:      staff.lastName,
            systemRole:    staff.systemRole as any,
            domain:        'CRM' as any,
            status:        'ACTIVE' as any,
            emailVerified: true,
          } as any,
        });
        userId = user.id;
        created++;
        process.stdout.write('created\n');
      }

      // Ensure correct Role linked via UserRole (remove stale links, add correct one)
      const correctRoleId = roleMap.get(staff.systemRole)!;

      // Remove any existing UserRole entries for this user
      await (prisma as any).userRole.deleteMany({
        where: { userId },
      });

      // Create the correct UserRole link
      await (prisma as any).userRole.create({
        data: { userId, roleId: correctRoleId },
      });

      // Write audit log (best-effort — don't fail seed if table missing)
      try {
        await (prisma as any).auditLog?.create({
          data: {
            userId,
            action:     existing ? 'CRM_STAFF_SEED_UPDATE' : 'CRM_STAFF_SEED_CREATE',
            entityType: 'USER',
            entityId:   userId,
            metadata:   JSON.stringify({
              email:      staff.email,
              systemRole: staff.systemRole,
              seededAt:   new Date().toISOString(),
              environment: process.env['NODE_ENV'] ?? 'development',
            }),
          },
        });
      } catch {
        // AuditLog may not exist yet — ignore silently
      }

    } catch (err) {
      process.stdout.write('❌ ERROR\n');
      console.error(`     ${(err as Error).message}`);
      errors++;
    }
  }

  // -------------------------------------------------------
  // Summary
  // -------------------------------------------------------

  console.log('');
  console.log('='.repeat(60));
  console.log(`Results:`);
  console.log(`  ✅ Created : ${created}`);
  console.log(`  🔄 Updated : ${updated}`);
  console.log(`  ❌ Errors  : ${errors}`);
  console.log('');

  if (errors > 0) {
    console.error('[seed-crm-staff] ❌ Seed completed with errors — check output above.');
    process.exit(1);
  }

  console.log('[seed-crm-staff] ✅ CRM staff seed complete!');
  console.log('');
  console.log('Accounts by role:');

  const byRole: Record<string, string[]> = {};
  for (const s of CRM_STAFF) {
    (byRole[s.systemRole] ??= []).push(s.email);
  }
  for (const [role, emails] of Object.entries(byRole)) {
    console.log(`  ${role} (${emails.length}):`);
    for (const email of emails) {
      console.log(`    - ${email}`);
    }
  }

  console.log('');
  console.log('⚠️  REMINDER: These are staging credentials.');
  console.log('   Issue unique personal passwords + MFA before production use.');
}

main()
  .catch((err) => {
    console.error('[seed-crm-staff] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
