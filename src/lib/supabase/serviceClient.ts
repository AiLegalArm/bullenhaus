/**
 * serviceClient.ts — Supabase service role client
 *
 * ⚠️  SECURITY CRITICAL ⚠️
 * This client uses SUPABASE_SERVICE_ROLE_KEY which BYPASSES ALL RLS POLICIES.
 * Use ONLY for:
 *   - Worker service background jobs
 *   - Migration scripts
 *   - Server-side admin operations that legitimately need cross-domain access
 *
 * NEVER:
 *   - Import this file from any frontend bundle
 *   - Expose SUPABASE_SERVICE_ROLE_KEY in any VITE_* env var
 *   - Use this client in request handlers that run on behalf of regular users
 *
 * This file uses process.env (Node.js only).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase service role client.
 * Throws if called from a context where the service role key is not available.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[supabase/serviceClient] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'This client is for backend/worker use only — never expose this key to the frontend.'
    );
  }

  _serviceClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceClient;
}

/**
 * Run a callback with the service client, then return the result.
 * Convenience wrapper for one-off admin operations.
 */
export async function withServiceClient<T>(
  fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  return fn(getSupabaseServiceClient());
}
