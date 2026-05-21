/**
 * authClient.ts — Frontend authentication client
 *
 * Security model:
 *   - Access token is stored IN MEMORY ONLY (never localStorage / sessionStorage)
 *     → XSS cannot steal the token even if injected script runs
 *   - Refresh token is stored in an HttpOnly, SameSite=Strict cookie
 *     → Set by the server; JS cannot read it
 *   - On page refresh, the client calls /auth/refresh using the cookie
 *     → If the cookie is valid, a new access token is returned
 *
 * This module is safe to import in frontend bundles.
 * It has no Node.js-only imports.
 */

import type {
  LoginRequest,
  LoginResult,
  MfaVerifyRequest,
  RefreshResponse,
} from '../../types/auth.types.js';

// -------------------------------------------------------
// In-memory token store (module-level singleton)
// -------------------------------------------------------

let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string): void => { _accessToken = token; },
  clear: (): void => { _accessToken = null; },
};

// -------------------------------------------------------
// API base URL (read from Vite env or window fallback)
// -------------------------------------------------------

function getApiBase(): string {
  // In Vite: import.meta.env.VITE_API_URL
  // In tests or SSR fallback: window.__API_URL or empty string
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL as string;
  }
  if (typeof window !== 'undefined' && (window as any).__API_URL) {
    return (window as any).__API_URL as string;
  }
  return '';
}

// -------------------------------------------------------
// Fetch wrapper (adds Authorization header automatically)
// -------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStore.get();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: 'include', // send/receive HttpOnly cookies (refresh token)
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// -------------------------------------------------------
// Auth API methods
// -------------------------------------------------------

/**
 * Login with email + password.
 * On success, stores the access token in memory.
 * Returns either a full LoginResponse or an MfaRequiredResponse.
 */
export async function login(credentials: LoginRequest): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (!('mfaRequired' in result)) {
    tokenStore.set(result.accessToken);
  }

  return result;
}

/**
 * Complete MFA verification. Stores access token on success.
 */
export async function verifyMfa(payload: MfaVerifyRequest): Promise<import('../../types/auth.types.js').LoginResponse> {
  const result = await apiFetch<import('../../types/auth.types.js').LoginResponse>('/api/v1/auth/verify-mfa', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  tokenStore.set(result.accessToken);
  return result;
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 * Call this on app load and when a 401 is received.
 * Returns null if the refresh token is expired or missing.
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const result = await apiFetch<RefreshResponse>('/api/v1/auth/refresh', {
      method: 'POST',
    });
    tokenStore.set(result.accessToken);
    return result.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

/**
 * Logout from the current device.
 * Clears the in-memory token; the server clears the refresh cookie.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  } finally {
    tokenStore.clear();
  }
}

/**
 * Logout from ALL devices (revokes all sessions).
 * Useful when a security issue is suspected.
 */
export async function logoutAll(): Promise<void> {
  try {
    await apiFetch('/api/v1/auth/logout-all', { method: 'POST' });
  } finally {
    tokenStore.clear();
  }
}

// -------------------------------------------------------
// Error class
// -------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean { return this.status === 401; }
  get isForbidden(): boolean { return this.status === 403; }
  get isNotFound(): boolean { return this.status === 404; }
  get isRateLimited(): boolean { return this.status === 429; }
}
