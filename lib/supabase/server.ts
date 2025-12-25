/**
 * Supabase Server Client
 * Lazy-initialized to avoid build-time errors when env vars not available
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase admin client (service role)
 * Lazy-initialized to work with Next.js build process
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
}

/**
 * Shorthand for common queries
 */
export const db = {
  deals: () => getSupabaseAdmin().from('deals'),
  cdes: () => getSupabaseAdmin().from('cdes'),
  investors: () => getSupabaseAdmin().from('investors'),
  sponsors: () => getSupabaseAdmin().from('sponsors'),
  organizations: () => getSupabaseAdmin().from('organizations'),
  users: () => getSupabaseAdmin().from('users'),
  documents: () => getSupabaseAdmin().from('documents'),
  censusTract: () => getSupabaseAdmin().from('census_tracts'),
  commitments: () => getSupabaseAdmin().from('commitments'),
  ledger: () => getSupabaseAdmin().from('ledger_events'),
};
