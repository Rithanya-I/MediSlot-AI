/**
 * Supabase JS client — used for Storage, Realtime, Edge Functions, etc.
 *
 * The database (PostgreSQL) is accessed via Drizzle ORM + pg pool using
 * DATABASE_URL. Use this client only for Supabase-specific features.
 *
 * Environment variables required:
 *   SUPABASE_URL      — your project URL (https://[ref].supabase.co)
 *   SUPABASE_ANON_KEY — the public anon key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://oscrngkopsnjqddscayx.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  'sb_publishable_RrO7Igs7CglgMXyuING5yg_xk0za7vG';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

