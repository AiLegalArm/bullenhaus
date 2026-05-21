/**
 * browserClient.ts — Supabase browser client (anon key)
 *
 * Used in the frontend for:
 *   - File storage (if needed)
 *   - Real-time subscriptions (if needed)
 *
 * NOT used for authentication — auth is handled by custom JWT.
 * NEVER import SUPABASE_SERVICE_ROLE_KEY here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite injects these as compile-time constants.
// They are intentionally public (anon key has RLS enforced).
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase browser client.
 * Returns null if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are not set
 * (Supabase features are optional for the frontend).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Disable Supabase Auth — we use custom JWT
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}
