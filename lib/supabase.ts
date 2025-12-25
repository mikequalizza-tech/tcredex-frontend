import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// LAZY-INITIALIZED CLIENTS
// These functions create the client only when first called at runtime,
// avoiding build-time errors when env vars aren't available
// =============================================================================

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get client-side Supabase (uses anon key)
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase client environment variables');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Get server-side Supabase (uses service role key for full access)
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // During build, return a dummy client that will fail at runtime
      // This prevents build errors while ensuring runtime checks work
      if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
        console.warn('Supabase admin env vars not available during build');
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
      }
      throw new Error('Missing Supabase admin environment variables');
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

// =============================================================================
// LEGACY EXPORTS (deprecated - use getSupabase/getSupabaseAdmin instead)
// These use getter functions to defer initialization until runtime
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createLazyClient = (getter: () => SupabaseClient): any => {
  return new Proxy({}, {
    get(_, prop) {
      const client = getter();
      const value = (client as unknown as Record<string, unknown>)[prop as string];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });
};

export const supabase: SupabaseClient = createLazyClient(getSupabase);
export const supabaseAdmin: SupabaseClient = createLazyClient(getSupabaseAdmin);

// =============================================================================
// TYPES
// =============================================================================

export interface CensusTract {
  geoid: string;
  state_name: string;
  county_name: string;
  nmtc_eligible: boolean;
  poverty_rate: number | null;
  poverty_qualifies: boolean;
  median_income_pct: number | null;
  income_qualifies: boolean;
  unemployment_rate: number | null;
  unemployment_qualifies: boolean;
  state_nmtc: boolean;
  nmtc_transferable: string | null;
  nmtc_refundable: string | null;
  state_htc: boolean;
  htc_transferable: string | null;
  htc_refundable: string | null;
  brownfield_credit: boolean;
  brownfield_transferable: string | null;
  brownfield_refundable: string | null;
  classification: string | null;
}

export interface StateCredit {
  id: number;
  state_name: string;
  is_state_nmtc: boolean | null;
  is_state_nmtc_transferable: boolean | null;
  is_state_nmtc_refundable: boolean | null;
  state_nmtc_notes_url: string | null;
  is_state_htc: boolean | null;
  is_state_htc_transferable: string | null;
  is_state_htc_refundable: string | null;
  state_htc_notes_url: string | null;
  is_state_brownfield: boolean | null;
  is_state_brownfield_transferable: string | null;
  is_state_brownfield_refundable: string | null;
  state_brownfield_notes_url: string | null;
  stacking_notes: string | null;
  state_credit_tags: string | null;
}
