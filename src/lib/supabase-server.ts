/**
 * Supabase JS client for the Express server (Node.js).
 *
 * Uses the service role key for server-side operations that need to bypass RLS.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Environment variables required (server-only):
 *   SUPABASE_URL              — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY — the secret service role key (keep private!)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Non-fatal: only throw if the caller actually uses this client.
  // The app works without it — Drizzle ORM handles DB access.
  console.warn(
    '[supabase-server] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Supabase server client is unavailable.'
  );
}

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;
