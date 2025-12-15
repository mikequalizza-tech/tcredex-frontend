import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (uses service role key for full access)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

// Types for our tables
export interface CensusTract {
  tract_id: string;
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
