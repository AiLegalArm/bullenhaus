/**
 * serverClient.ts — Supabase server client (anon key)
 *
 * For backend use when you need to respect RLS policies —
 * i.e., queries run AS the authenticated user (via JWT).
 *
 * Do NOT use this for admin/worker operations — use serviceClient instead.
 * This file uses process.env (Node.js) — not for browser bundles.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!_client) {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_ANON_KEY'];

    if (!url || !key) {
      throw new Error(
        '[supabase/serverClient] SUPABASE_URL or SUPABASE_ANON_KEY is not set. ' +
          'Check your .env file.'
      );
    }

    _client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _client;
}

/**
 * Create a Supabase client that authenticates as a specific user by injecting
 * their JWT into the Authorization header. This makes RLS policies apply
 * for that user's role and domain.
 */
export function getSupabaseClientForUser(accessToken: string): SupabaseClient {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_ANON_KEY'];

  if (!url || !key) {
    throw new Error(
      '[supabase/serverClient] SUPABASE_URL or SUPABASE_ANON_KEY is not set.'
    );
  }

  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
