/**
 * roles.ts — System role constants and domain mappings
 *
 * Single source of truth for role → domain mapping.
 * Used by both frontend guards and backend middleware.
 */

import type { Domain, SystemRole } from '../../types/auth.types.js';

// -------------------------------------------------------
// Role constants
// -------------------------------------------------------

export const ROLES = {
  SUPER_ADMIN:       'SUPER_ADMIN',
  CRM_ADMIN:         'CRM_ADMIN',
  CRM_DIRECTOR:      'CRM_DIRECTOR',
  CRM_MANAGER:       'CRM_MANAGER',
  CRM_AGENT:         'CRM_AGENT',
  TRADING_OPERATOR:  'TRADING_OPERATOR',
  TRADER:            'TRADER',
} as const satisfies Record<SystemRole, SystemRole>;

// -------------------------------------------------------
// Domain membership
// -------------------------------------------------------

/** Roles that belong to the CRM domain (or BOTH). */
export const CRM_ROLES: ReadonlySet<SystemRole> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.CRM_ADMIN,
  ROLES.CRM_DIRECTOR,
  ROLES.CRM_MANAGER,
  ROLES.CRM_AGENT,
]);

/** Roles that belong to the Trading domain (or BOTH). */
export const TRADING_ROLES: ReadonlySet<SystemRole> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.TRADING_OPERATOR,
  ROLES.TRADER,
]);

/** Roles with admin-level CRM management. */
export const CRM_ADMIN_ROLES: ReadonlySet<SystemRole> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.CRM_ADMIN,
]);

/** Roles with admin-level Trading management. */
export const TRADING_ADMIN_ROLES: ReadonlySet<SystemRole> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.TRADING_OPERATOR,
]);

// -------------------------------------------------------
// Role → Domain mapping
// -------------------------------------------------------

export const ROLE_DOMAIN_MAP: Readonly<Record<SystemRole, Domain>> = {
  SUPER_ADMIN:      'BOTH',
  CRM_ADMIN:        'CRM',
  CRM_DIRECTOR:     'CRM',
  CRM_MANAGER:      'CRM',
  CRM_AGENT:        'CRM',
  TRADING_OPERATOR: 'TRADING',
  TRADER:           'TRADING',
};

// -------------------------------------------------------
// Post-login redirect
// -------------------------------------------------------

/** Where to redirect each domain after successful login. */
export const DOMAIN_REDIRECT: Readonly<Record<Domain, string>> = {
  CRM:     '/crm/dashboard',
  TRADING: '/trade/dashboard',
  BOTH:    '/admin/dashboard',
};

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

export function isCrmRole(role: SystemRole): boolean {
  return CRM_ROLES.has(role);
}

export function isTradingRole(role: SystemRole): boolean {
  return TRADING_ROLES.has(role);
}

export function isSuperAdmin(role: SystemRole): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function getDomainForRole(role: SystemRole): Domain {
  return ROLE_DOMAIN_MAP[role];
}

export function getRedirectForDomain(domain: Domain): string {
  return DOMAIN_REDIRECT[domain];
}

export function isValidRole(value: unknown): value is SystemRole {
  return typeof value === 'string' && value in ROLES;
}
