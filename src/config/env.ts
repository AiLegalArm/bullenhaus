/**
 * env.ts — Centralised environment variable validation
 *
 * Fails FAST on startup if any required variable is missing.
 * Import this module once at the top of your server entry point.
 * Never import from this module in frontend bundles — it uses `process.env`.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}\n` +
        `Copy .env.example to .env and set all required values.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

// -------------------------------------------------------
// Database
// -------------------------------------------------------
export const DATABASE_URL = requireEnv('DATABASE_URL');
export const DIRECT_URL = requireEnv('DIRECT_URL');

// -------------------------------------------------------
// JWT
// -------------------------------------------------------
export const JWT_ACCESS_SECRET = requireEnv('JWT_ACCESS_SECRET');
export const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
export const JWT_ACCESS_EXPIRES_IN = optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m')!;
export const JWT_REFRESH_EXPIRES_IN = optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d')!;

// -------------------------------------------------------
// Supabase
// -------------------------------------------------------
export const SUPABASE_URL = requireEnv('SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('SUPABASE_ANON_KEY');

/**
 * SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security.
 * Must ONLY be used in backend / worker processes.
 * Never expose this to any frontend bundle.
 */
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

// -------------------------------------------------------
// Worker
// -------------------------------------------------------
export const WORKER_API_KEY = requireEnv('WORKER_API_KEY');

// -------------------------------------------------------
// Sync / Webhook
// -------------------------------------------------------
export const SYNC_WEBHOOK_SECRET = requireEnv('SYNC_WEBHOOK_SECRET');

// -------------------------------------------------------
// Server
// -------------------------------------------------------
export const NODE_ENV = optionalEnv('NODE_ENV', 'development')!;
export const PORT = parseInt(optionalEnv('PORT', '3000')!, 10);
export const APP_URL = optionalEnv('APP_URL', 'http://localhost:3000')!;
export const ALLOWED_ORIGINS = optionalEnv(
  'ALLOWED_ORIGINS',
  'http://localhost:5173'
)!
  .split(',')
  .map((o) => o.trim());

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// -------------------------------------------------------
// Optional: Redis (JWT denylist)
// -------------------------------------------------------
export const REDIS_URL = optionalEnv('REDIS_URL');

// -------------------------------------------------------
// Optional: AI
// -------------------------------------------------------
export const GEMINI_API_KEY = optionalEnv('GEMINI_API_KEY');

// -------------------------------------------------------
// Validation guard — call once at server start
// -------------------------------------------------------
export function validateEnv(): void {
  // All requireEnv() calls above already throw, but this function
  // provides a single call site to document the intent.
  if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
    throw new Error(
      '[env] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.'
    );
  }
  if (JWT_ACCESS_SECRET.length < 32) {
    throw new Error('[env] JWT_ACCESS_SECRET must be at least 32 characters.');
  }
  if (JWT_REFRESH_SECRET.length < 32) {
    throw new Error('[env] JWT_REFRESH_SECRET must be at least 32 characters.');
  }
  console.log('[env] Environment validated OK');
}
