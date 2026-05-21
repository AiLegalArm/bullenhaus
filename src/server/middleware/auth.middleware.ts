/**
 * auth.middleware.ts — JWT verification and user attachment
 *
 * Middleware chain: requireAuth → domainGuard → requirePermissions
 *
 * What it does:
 *   1. Reads the Bearer token from Authorization header
 *   2. Verifies the JWT signature using JWT_ACCESS_SECRET
 *   3. Checks the JWT denylist (Redis or DB) for revoked tokens
 *   4. Loads fresh permissions from DB (prevents stale-permission attacks)
 *   5. Attaches req.user with id, systemRole, domain, permissions
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_ACCESS_SECRET, REDIS_URL } from '../../config/env.js';
import type { JwtAccessPayload, RequestUser } from '../../types/auth.types.js';

const prisma = new PrismaClient();

// -------------------------------------------------------
// Redis denylist (optional)
// -------------------------------------------------------

let _redis: import('ioredis').Redis | null = null;

async function isTokenDenylisted(jti: string): Promise<boolean> {
  if (REDIS_URL) {
    try {
      if (!_redis) {
        const { default: Redis } = await import('ioredis');
        _redis = new Redis(REDIS_URL);
      }
      const result = await _redis.get(`denylist:${jti}`);
      return result !== null;
    } catch {
      // Redis unavailable — fall through to DB check
    }
  }

  // DB fallback: DenylistedToken table
  try {
    const denied = await (prisma as any).denylistedToken?.findUnique({
      where: { jti },
    });
    return !!denied;
  } catch {
    return false; // If table doesn't exist yet, don't block
  }
}

// -------------------------------------------------------
// requireAuth middleware
// -------------------------------------------------------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

/**
 * requireAuth — Validates the JWT and attaches req.user.
 * Must be applied before any domain or permission guards.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization header missing or malformed' });
      return;
    }

    const token = authHeader.slice(7);
    let payload: JwtAccessPayload;

    try {
      payload = jwt.verify(token, JWT_ACCESS_SECRET) as JwtAccessPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token expired' });
      } else {
        res.status(401).json({ message: 'Token invalid' });
      }
      return;
    }

    // Check denylist (logout-all scenario)
    if (await isTokenDenylisted(payload.jti)) {
      res.status(401).json({ message: 'Token has been revoked' });
      return;
    }

    // Load fresh user data from DB (catches suspension mid-session)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if ((user as any).status === 'SUSPENDED' || (user as any).status === 'DELETED') {
      res.status(403).json({ message: 'Account suspended' });
      return;
    }

    // Flatten permissions from all roles
    const permissions = Array.from(
      new Set(
        (user as any).userRoles?.flatMap((ur: any) =>
          ur.role?.rolePermissions?.map((rp: any) => rp.permission?.name) ?? []
        ) ?? []
      )
    ).filter(Boolean) as string[];

    req.user = {
      id: user.id,
      email: user.email,
      systemRole: (user as any).systemRole ?? payload.systemRole,
      domain: (user as any).domain ?? payload.domain,
      permissions,
      jti: payload.jti,
      roles: [(user as any).systemRole ?? payload.systemRole],
    };

    next();
  } catch (err) {
    console.error('[auth.middleware] Unexpected error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// -------------------------------------------------------
// requirePermissions middleware factory
// -------------------------------------------------------

/**
 * requirePermissions — Guards a route by required permission strings.
 * Must be used after requireAuth.
 *
 * @example
 *   router.get('/clients', requireAuth, requirePermissions('crm.clients.view_all'), handler)
 */
export function requirePermissions(...permissions: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const missing = permissions.filter((p) => !req.user!.permissions.includes(p));
    if (missing.length > 0) {
      res.status(403).json({
        message: 'Insufficient permissions',
        required: missing,
      });
      return;
    }

    next();
  };
}
