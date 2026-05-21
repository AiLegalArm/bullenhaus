/**
 * access.ts — Access check helper functions
 *
 * Thin, pure functions that answer yes/no questions about a user's
 * role and permissions. Used by both frontend guards and backend middleware.
 * No Node.js-only imports — safe to use in browser bundles.
 */

import type { Domain, RequestUser, SystemRole } from '../../types/auth.types.js';
import { CRM_ROLES, TRADING_ROLES } from './roles.js';

// -------------------------------------------------------
// Domain checks
// -------------------------------------------------------

export function canAccessCrm(domain: Domain): boolean {
  return domain === 'CRM' || domain === 'BOTH';
}

export function canAccessTrading(domain: Domain): boolean {
  return domain === 'TRADING' || domain === 'BOTH';
}

export function canAccessAdmin(role: SystemRole): boolean {
  return role === 'SUPER_ADMIN';
}

// -------------------------------------------------------
// Role checks
// -------------------------------------------------------

export function hasRole(user: Pick<RequestUser, 'systemRole'>, role: SystemRole): boolean {
  return user.systemRole === role;
}

export function hasAnyRole(
  user: Pick<RequestUser, 'systemRole'>,
  roles: readonly SystemRole[]
): boolean {
  return roles.includes(user.systemRole);
}

export function isSuperAdmin(user: Pick<RequestUser, 'systemRole'>): boolean {
  return user.systemRole === 'SUPER_ADMIN';
}

export function isCrmUser(user: Pick<RequestUser, 'systemRole'>): boolean {
  return CRM_ROLES.has(user.systemRole);
}

export function isTradingUser(user: Pick<RequestUser, 'systemRole'>): boolean {
  return TRADING_ROLES.has(user.systemRole);
}

// -------------------------------------------------------
// Permission checks
// -------------------------------------------------------

export function hasPermission(
  user: Pick<RequestUser, 'permissions'>,
  permission: string
): boolean {
  return user.permissions.includes(permission);
}

export function hasAllPermissions(
  user: Pick<RequestUser, 'permissions'>,
  permissions: readonly string[]
): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}

export function hasAnyPermission(
  user: Pick<RequestUser, 'permissions'>,
  permissions: readonly string[]
): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

// -------------------------------------------------------
// Compound checks (role + domain together)
// -------------------------------------------------------

export function assertCanAccessCrm(user: Pick<RequestUser, 'domain'>): void {
  if (!canAccessCrm(user.domain)) {
    throw new AccessDeniedError(
      `Domain '${user.domain}' is not permitted to access CRM resources.`
    );
  }
}

export function assertCanAccessTrading(user: Pick<RequestUser, 'domain'>): void {
  if (!canAccessTrading(user.domain)) {
    throw new AccessDeniedError(
      `Domain '${user.domain}' is not permitted to access Trading resources.`
    );
  }
}

export function assertHasPermission(
  user: Pick<RequestUser, 'permissions'>,
  permission: string
): void {
  if (!hasPermission(user, permission)) {
    throw new AccessDeniedError(`Missing required permission: ${permission}`);
  }
}

// -------------------------------------------------------
// Error type
// -------------------------------------------------------

export class AccessDeniedError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}
