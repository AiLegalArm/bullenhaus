/**
 * seed-unified-roles.ts — Seed the Role and Permission tables
 *
 * Creates all 7 system roles and their associated permissions.
 * Safe to run multiple times (upsert pattern).
 *
 * Run via: npm run db:seed
 *       or: npx tsx prisma/seed-unified-roles.ts
 */

import { PrismaClient } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../src/lib/rbac/permissions.js';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting unified roles seed...');

  // -------------------------------------------------------
  // Collect all unique permissions across all roles
  // -------------------------------------------------------

  const allPermissions = Array.from(
    new Set(Object.values(ROLE_PERMISSIONS).flatMap((perms) => [...perms]))
  );

  console.log(`[seed] Upserting ${allPermissions.length} permissions...`);

  for (const permName of allPermissions) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: {
        name: permName,
        description: permName, // Use name as description for now
      },
    });
  }

  // -------------------------------------------------------
  // Create/update each role with its permissions
  // -------------------------------------------------------

  const roles = Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>;

  for (const roleName of roles) {
    const rolePermNames = ROLE_PERMISSIONS[roleName];

    console.log(`[seed] Upserting role ${roleName} with ${rolePermNames.length} permissions...`);

    // Upsert the Role
    const role = await (prisma as any).role.upsert({
      where: { name: roleName },
      update: { description: `System role: ${roleName}` },
      create: {
        name: roleName,
        description: `System role: ${roleName}`,
      },
    });

    // Remove old role-permission links (clean slate for this role)
    await (prisma as any).rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Fetch permission IDs
    const permRecords = await prisma.permission.findMany({
      where: { name: { in: [...rolePermNames] } },
    });

    // Create role-permission links
    for (const perm of permRecords) {
      await (prisma as any).rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }

    console.log(`[seed]   ✓ ${roleName} — ${permRecords.length} permissions linked`);
  }

  console.log('[seed] ✅ Unified roles seed complete!');
  console.log('');
  console.log('[seed] Roles created:');
  for (const role of roles) {
    console.log(`  - ${role} (${ROLE_PERMISSIONS[role].length} permissions)`);
  }
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
