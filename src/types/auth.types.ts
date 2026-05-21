/**
 * auth.types.ts — Unified authentication and authorization types
 *
 * Shared between frontend and backend (no Node-only imports here).
 */

// -------------------------------------------------------
// Domains
// -------------------------------------------------------

/** Which platform this user belongs to. */
export type Domain = 'CRM' | 'TRADING' | 'BOTH';

// -------------------------------------------------------
// System Roles
// -------------------------------------------------------

/**
 * Unified system role — single source of truth.
 * Each role maps to exactly one domain (except SUPER_ADMIN = BOTH).
 */
export type SystemRole =
  | 'SUPER_ADMIN'        // domain: BOTH   — full cross-platform access
  | 'CRM_ADMIN'          // domain: CRM    — full CRM management
  | 'CRM_DIRECTOR'       // domain: CRM    — operational lead
  | 'CRM_MANAGER'        // domain: CRM    — team management
  | 'CRM_AGENT'          // domain: CRM    — assigned clients/leads only
  | 'TRADING_OPERATOR'   // domain: TRADING — platform management
  | 'TRADER';            // domain: TRADING — own account only

// -------------------------------------------------------
// JWT Payload
// -------------------------------------------------------

/** Claims embedded in the JWT access token. */
export interface JwtAccessPayload {
  /** Subject — User.id (UUID) */
  sub: string;
  /** JWT ID — used for denylist checks */
  jti: string;
  systemRole: SystemRole;
  domain: Domain;
  /** Issued at (epoch seconds) */
  iat: number;
  /** Expiry (epoch seconds) */
  exp: number;
}

/** Claims embedded in the JWT refresh token. */
export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  /** Token family — for refresh token rotation */
  family: string;
  iat: number;
  exp: number;
}

// -------------------------------------------------------
// Auth Response Shapes
// -------------------------------------------------------

/** Minimal user info returned to the frontend after login. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: SystemRole;
  domain: Domain;
  /** Present if user has a linked trading account */
  tradingAccountId?: string;
  /** Gravatar/profile photo URL */
  avatarUrl?: string;
}

/** Successful login response (no MFA required). */
export interface LoginResponse {
  /** Short-lived JWT — store IN MEMORY ONLY, never localStorage */
  accessToken: string;
  user: AuthUser;
  permissions: string[];
}

/** Login response when MFA is required. */
export interface MfaRequiredResponse {
  mfaRequired: true;
  /** One-time session token for the /auth/verify-mfa endpoint */
  mfaSessionToken: string;
}

export type LoginResult = LoginResponse | MfaRequiredResponse;

/** Token refresh response. */
export interface RefreshResponse {
  accessToken: string;
}

// -------------------------------------------------------
// Login Request
// -------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MfaVerifyRequest {
  mfaSessionToken: string;
  totpCode: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// -------------------------------------------------------
// Express req.user augmentation
// -------------------------------------------------------

/**
 * Shape of req.user attached by auth.middleware after JWT verification.
 * Import and use in Express request handlers.
 */
export interface RequestUser {
  id: string;
  email: string;
  systemRole: SystemRole;
  domain: Domain;
  permissions: string[];
  jti: string;
  /** Backward compat: role name strings for legacy guards */
  roles: string[];
}

// -------------------------------------------------------
// RBAC helpers
// -------------------------------------------------------

export type PermissionString = string;

/** A guard function shape used by middleware. */
export type DomainGuard = (domain: Domain) => boolean;
