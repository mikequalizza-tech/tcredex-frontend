/**
 * Supabase Client Configuration
 *
 * Provides both client-side and server-side Supabase clients
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (uses anon key)
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// Server-side Supabase admin client (uses service role key)
let supabaseAdminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdminClient) {
    // Use service key if available, otherwise fall back to anon key
    const key = supabaseServiceKey || supabaseAnonKey;
    supabaseAdminClient = createClient<Database>(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClient;
}

// Export the admin client directly for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();

// Re-export for convenience
export { createClient };
