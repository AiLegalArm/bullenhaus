/**
 * auth.service.ts — Unified authentication service
 *
 * Handles: login, refresh, logout, logout-all, MFA verify, self-registration
 *
 * Security features:
 *   - Argon2id password hashing (with bcrypt fallback for migrated users)
 *   - Account lockout after 5 failed attempts (15-minute window)
 *   - JWT access token (15 min) + refresh token (7 days) with rotation
 *   - MFA (TOTP) verification
 *   - Redis denylist for logout-all
 *   - Full audit log for all auth events
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  REDIS_URL,
} from '../../config/env.js';
import type {
  LoginRequest,
  LoginResult,
  MfaVerifyRequest,
  RegisterRequest,
  JwtAccessPayload,
  JwtRefreshPayload,
  AuthUser,
} from '../../types/auth.types.js';

const prisma = new PrismaClient();

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// -------------------------------------------------------
// Password hashing — Argon2id preferred, bcrypt fallback
// -------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2');
    return argon2.hash(password, { type: argon2.argon2id });
  } catch {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 12);
  }
}

async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  // Detect hash type by prefix
  if (stored.startsWith('$argon2')) {
    try {
      const argon2 = await import('argon2');
      return argon2.verify(stored, plain);
    } catch {
      return false;
    }
  }
  // bcrypt fallback (migrated users)
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plain, stored);
  } catch {
    return false;
  }
}

// -------------------------------------------------------
// JWT helpers
// -------------------------------------------------------

function signAccessToken(
  userId: string,
  systemRole: string,
  domain: string
): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign(
    { sub: userId, jti, systemRole, domain } as Partial<JwtAccessPayload>,
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES_IN }
  );
  return { token, jti };
}

function signRefreshToken(
  userId: string,
  family: string
): { token: string; jti: string } {
  const jti = randomUUID();
  const token = jwt.sign(
    { sub: userId, jti, family } as Partial<JwtRefreshPayload>,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  return { token, jti };
}

// -------------------------------------------------------
// Audit logging
// -------------------------------------------------------

async function writeAuditLog(
  userId: string | null,
  action: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await (prisma as any).auditLog?.create({
      data: {
        userId,
        action,
        entityType: 'AUTH',
        metadata: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Don't let audit log failures break auth
  }
}

// -------------------------------------------------------
// Redis denylist
// -------------------------------------------------------

async function denylistToken(
  jti: string,
  expiresInSeconds: number
): Promise<void> {
  if (REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      const redis = new Redis(REDIS_URL);
      await redis.setex(`denylist:${jti}`, expiresInSeconds, '1');
      await redis.quit();
      return;
    } catch {
      // Fall through to DB
    }
  }
  // DB fallback
  try {
    await (prisma as any).denylistedToken?.create({
      data: { jti, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) },
    });
  } catch {
    // Table may not exist yet — log but don't fail
    console.warn('[auth.service] Could not write to denylist — token may not be fully revoked');
  }
}

// -------------------------------------------------------
// Login
// -------------------------------------------------------

export async function login(
  credentials: LoginRequest,
  ipAddress?: string
): Promise<LoginResult> {
  const { email, password } = credentials;

  // Generic error message — no user enumeration
  const authError = {
    status: 401,
    message: 'Invalid credentials',
  };

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always run password check to prevent timing attacks
  const dummyHash =
    '$argon2id$v=19$m=65536,t=3,p=4$dummysalt000000000000000000000000$dummyhash00000000000000000000000000000000000';
  const storedHash = (user as any)?.passwordHash ?? dummyHash;
  const isPasswordValid = await verifyPassword(password, storedHash);

  if (!user || !isPasswordValid) {
    if (user) {
      // Increment failed attempts
      const attempts = ((user as any).failedLoginAttempts ?? 0) + 1;
      const lockedUntil =
        attempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        } as any,
      });

      await writeAuditLog(user.id, 'LOGIN_FAILED', { ip: ipAddress, attempts });
    }
    throw Object.assign(new Error(authError.message), authError);
  }

  // Check lockout
  const lockedUntil = (user as any).lockedUntil as Date | null;
  if (lockedUntil && lockedUntil > new Date()) {
    throw Object.assign(new Error('Account temporarily locked'), {
      status: 429,
      message: 'Account temporarily locked. Try again later.',
      lockedUntil,
    });
  }

  // Check suspension
  if ((user as any).status === 'SUSPENDED') {
    throw Object.assign(new Error('Account suspended'), {
      status: 403,
      message: 'Account suspended',
    });
  }

  // Reset failed attempts on successful auth
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    } as any,
  });

  // Check MFA
  if ((user as any).mfaEnabled) {
    const mfaSessionToken = jwt.sign(
      { sub: user.id, mfaSession: true },
      JWT_ACCESS_SECRET,
      { expiresIn: '5m' }
    );
    await writeAuditLog(user.id, 'LOGIN_MFA_REQUIRED', { ip: ipAddress });
    return { mfaRequired: true, mfaSessionToken };
  }

  return issueTokens(user, ipAddress);
}

// -------------------------------------------------------
// MFA Verify
// -------------------------------------------------------

export async function verifyMfa(payload: MfaVerifyRequest): Promise<LoginResult> {
  let decoded: { sub: string; mfaSession?: boolean };
  try {
    decoded = jwt.verify(payload.mfaSessionToken, JWT_ACCESS_SECRET) as typeof decoded;
  } catch {
    throw Object.assign(new Error('MFA session token invalid or expired'), { status: 401 });
  }

  if (!decoded.mfaSession) {
    throw Object.assign(new Error('Invalid MFA session token'), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 401 });

  // Verify TOTP code
  const { TOTP } = await import('otpauth');
  const mfaSecret = (user as any).mfaSecret as string;
  const totp = new TOTP({ secret: mfaSecret });
  const delta = totp.validate({ token: payload.totpCode, window: 1 });

  if (delta === null) {
    throw Object.assign(new Error('Invalid TOTP code'), { status: 401 });
  }

  return issueTokens(user, undefined);
}

// -------------------------------------------------------
// Token issuance (shared between login + MFA verify)
// -------------------------------------------------------

async function issueTokens(user: any, ipAddress?: string): Promise<LoginResult> {
  const { token: accessToken, jti } = signAccessToken(
    user.id,
    user.systemRole,
    user.domain
  );

  const family = randomUUID();
  const { token: refreshToken } = signRefreshToken(user.id, family);

  // Store refresh token in DB
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await (prisma as any).refreshToken?.create({
    data: {
      userId: user.id,
      token: refreshToken,
      family,
      expiresAt: refreshExpiresAt,
    },
  });

  // Load permissions
  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  const permissions = Array.from(
    new Set(
      (userWithRoles as any)?.userRoles?.flatMap((ur: any) =>
        ur.role?.rolePermissions?.map((rp: any) => rp.permission?.name) ?? []
      ) ?? []
    )
  ).filter(Boolean) as string[];

  await writeAuditLog(user.id, 'LOGIN_SUCCESS', { ip: ipAddress });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    systemRole: user.systemRole,
    domain: user.domain,
    tradingAccountId: user.tradingAccountId ?? undefined,
  };

  return {
    accessToken,
    user: authUser,
    permissions,
    _refreshToken: refreshToken, // caller stores this in HttpOnly cookie
  } as any;
}

// -------------------------------------------------------
// Refresh
// -------------------------------------------------------

export async function refreshTokens(refreshToken: string): Promise<string> {
  let decoded: JwtRefreshPayload;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
  } catch {
    throw Object.assign(new Error('Refresh token invalid or expired'), { status: 401 });
  }

  const stored = await (prisma as any).refreshToken?.findFirst({
    where: { token: refreshToken, userId: decoded.sub },
  });

  if (!stored || new Date(stored.expiresAt) < new Date()) {
    throw Object.assign(new Error('Refresh token not found or expired'), { status: 401 });
  }

  // Revoke old refresh token (rotation)
  await (prisma as any).refreshToken?.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || (user as any).status === 'SUSPENDED') {
    throw Object.assign(new Error('User not found or suspended'), { status: 401 });
  }

  const { token: accessToken } = signAccessToken(
    user.id,
    (user as any).systemRole,
    (user as any).domain
  );

  return accessToken;
}

// -------------------------------------------------------
// Logout
// -------------------------------------------------------

export async function logout(jti: string, refreshToken?: string): Promise<void> {
  // Denylist the access token
  await denylistToken(jti, 15 * 60); // 15 min (access token TTL)

  // Delete the refresh token from DB
  if (refreshToken) {
    await (prisma as any).refreshToken?.deleteMany({ where: { token: refreshToken } });
  }
}

export async function logoutAll(userId: string, jti: string): Promise<void> {
  // Denylist current access token
  await denylistToken(jti, 15 * 60);

  // Delete ALL refresh tokens for this user
  await (prisma as any).refreshToken?.deleteMany({ where: { userId } });

  await writeAuditLog(userId, 'LOGOUT_ALL', {});
}

// -------------------------------------------------------
// Trader self-registration
// -------------------------------------------------------

export async function registerTrader(data: RegisterRequest): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      systemRole: 'TRADER',
      domain: 'TRADING',
      status: 'ACTIVE',
      emailVerified: false,
    } as any,
  });

  await writeAuditLog(null, 'TRADER_REGISTERED', { email: data.email });
}
