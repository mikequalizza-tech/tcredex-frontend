/**
 * Tract Data Lookup for Section C Scoring Engine
 * ===============================================
 * Fetches census tract data from nmtc_ct_data_2025 (SOT)
 * and formats it for the Scoring Engine input format.
 *
 * Source of Truth: nmtc_ct_data_2025 (CDFI Fund 2025 data)
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { ScoringInput } from '@/types/scoring';

// =============================================================================
// TYPES
// =============================================================================

export interface TractDataForScoring {
  geoid: string;
  poverty_rate: number;
  median_family_income: number;
  unemployment_rate: number;
  state_mfi: number;
  metro_mfi?: number;
  is_lic_eligible: boolean;
  is_severely_distressed: boolean;
  is_qct: boolean;
  is_opportunity_zone: boolean;
  is_persistent_poverty_county: boolean;
  is_non_metro: boolean;
  is_high_migration: boolean;
  state_name: string;
  county_name: string;
}

interface NmtcCtData2025Row {
  geoid: string;
  metro_status: string | null;
  is_non_metro: boolean;
  is_lic_eligible: boolean;
  poverty_rate: number | null;
  qualifies_poverty: boolean;
  mfi_pct: number | null;
  qualifies_mfi: boolean;
  unemployment_rate: number | null;
  unemployment_ratio: number | null;
  county_fips: string | null;
  state_name: string | null;
  county_name: string | null;
  population: number | null;
  is_high_migration: boolean;
  is_severely_distressed: boolean;
  is_deeply_distressed: boolean;
  state_fips: string | null;
}

interface MasterSotRow {
  geoid: string;
  is_lihtc_qct_2025: boolean;
  is_lihtc_qct_2026: boolean;
  is_oz_designated: boolean;
}

interface StateMfiRow {
  median_family_income: number;
}

// =============================================================================
// STATE MFI LOOKUP
// =============================================================================

/**
 * Get the state median family income for MFI ratio calculation.
 * Falls back to a reasonable default if not found.
 */
async function getStateMfi(stateFips: string): Promise<number> {
  const supabase = getSupabaseAdmin();

  // Try state_nmtc_programs table first (has state-level economic data)
  const { data } = await supabase
    .from('state_nmtc_programs')
    .select('median_family_income')
    .eq('state_fips', stateFips)
    .single();

  const row = data as StateMfiRow | null;
  if (row?.median_family_income) {
    return row.median_family_income;
  }

  // Fallback: US national MFI (approximately $80,000 as of 2023)
  return 80000;
}

// =============================================================================
// TRACT LOOKUP FUNCTIONS
// =============================================================================

/**
 * Fetch tract data from nmtc_ct_data_2025 for scoring.
 * Also enriches with QCT and OZ data from master_tax_credit_sot.
 */
export async function getTractDataForScoring(
  geoid: string
): Promise<TractDataForScoring | null> {
  const supabase = getSupabaseAdmin();

  // Normalize GEOID
  const normalizedGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');

  // 1. Get NMTC tract data from SOT table
  const { data: nmtcData, error: nmtcError } = await supabase
    .from('nmtc_ct_data_2025')
    .select('*')
    .eq('geoid', normalizedGeoid)
    .single();

  if (nmtcError || !nmtcData) {
    console.warn(`[TractLookup] No NMTC data for ${normalizedGeoid}:`, nmtcError?.message);
    return null;
  }

  const tract = nmtcData as NmtcCtData2025Row;

  // 2. Get QCT and OZ data from master_tax_credit_sot
  const { data: sotData } = await supabase
    .from('master_tax_credit_sot')
    .select('geoid, is_lihtc_qct_2025, is_lihtc_qct_2026, is_oz_designated')
    .eq('geoid', normalizedGeoid)
    .single();

  const sot = sotData as MasterSotRow | null;
  const isQct = sot?.is_lihtc_qct_2025 || sot?.is_lihtc_qct_2026 || false;
  const isOz = sot?.is_oz_designated || false;

  // 3. Get state MFI for ratio calculation
  const stateFips = normalizedGeoid.substring(0, 2);
  const stateMfi = await getStateMfi(stateFips);

  // 4. Calculate tract MFI in dollars from percentage
  // mfi_pct is the tract MFI as % of benchmark (e.g., 74 means 74% of benchmark)
  const mfiPct = tract.mfi_pct || 100;
  const tractMfi = (mfiPct / 100) * stateMfi;

  // 5. Persistent Poverty County lookup
  // TODO: Add persistent_poverty_counties table if needed
  // For now, use severely_distressed + non_metro as proxy
  const isPpc = tract.is_severely_distressed && tract.is_non_metro;

  return {
    geoid: normalizedGeoid,
    poverty_rate: tract.poverty_rate || 0,
    median_family_income: tractMfi,
    unemployment_rate: tract.unemployment_rate || 0,
    state_mfi: stateMfi,
    is_lic_eligible: tract.is_lic_eligible,
    is_severely_distressed: tract.is_severely_distressed,
    is_qct: isQct,
    is_opportunity_zone: isOz,
    is_persistent_poverty_county: isPpc,
    is_non_metro: tract.is_non_metro,
    is_high_migration: tract.is_high_migration,
    state_name: tract.state_name || '',
    county_name: tract.county_name || '',
  };
}

/**
 * Lookup tract by coordinates using point-in-polygon.
 * Returns the GEOID which can then be used with getTractDataForScoring.
 */
export async function getTractGeoidAtPoint(
  lat: number,
  lng: number
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc('get_tract_at_point' as never, {
    p_lat: lat,
    p_lng: lng
  } as never);

  type RpcResult = { geoid: string }[];
  const result = data as RpcResult | null;

  if (error || !result || result.length === 0) {
    console.warn('[TractLookup] Point lookup failed:', error?.message);
    return null;
  }

  return result[0].geoid;
}

/**
 * Convenience function: lookup tract data by coordinates.
 */
export async function getTractDataAtPoint(
  lat: number,
  lng: number
): Promise<TractDataForScoring | null> {
  const geoid = await getTractGeoidAtPoint(lat, lng);
  if (!geoid) return null;
  return getTractDataForScoring(geoid);
}

/**
 * Build the tract portion of ScoringInput from TractDataForScoring.
 */
export function buildScoringInputTract(
  tractData: TractDataForScoring
): ScoringInput['tract'] {
  return {
    geoid: tractData.geoid,
    poverty_rate: tractData.poverty_rate,
    median_family_income: tractData.median_family_income,
    unemployment_rate: tractData.unemployment_rate,
    state_mfi: tractData.state_mfi,
    is_lic_eligible: tractData.is_lic_eligible,
    is_severely_distressed: tractData.is_severely_distressed,
    is_qct: tractData.is_qct,
    is_opportunity_zone: tractData.is_opportunity_zone,
    is_persistent_poverty_county: tractData.is_persistent_poverty_county,
    is_non_metro: tractData.is_non_metro,
  };
}

// =============================================================================
// RPC FUNCTION (for use in Supabase directly)
// =============================================================================

/**
 * Use the get_nmtc_distress_for_scoring RPC function if available.
 * This is more efficient as it runs in the database and includes QCT/OZ data.
 */
export async function getTractViaRpc(
  geoid: string
): Promise<TractDataForScoring | null> {
  const supabase = getSupabaseAdmin();
  const normalizedGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');

  // Try the new combined RPC function first
  const { data, error } = await supabase.rpc('get_nmtc_distress_for_scoring' as never, {
    p_geoid: normalizedGeoid
  } as never);

  interface RpcRow {
    geoid: string;
    is_lic_eligible: boolean;
    is_severely_distressed: boolean;
    is_deeply_distressed: boolean;
    is_high_migration: boolean;
    is_non_metro: boolean;
    poverty_rate: number | null;
    mfi_pct: number | null;
    unemployment_rate: number | null;
    unemployment_ratio: number | null;
    is_oz: boolean;
    is_qct: boolean;
    state_name: string | null;
    county_name: string | null;
  }

  const result = data as RpcRow[] | null;

  if (error || !result || result.length === 0) {
    // Fall back to direct query
    return getTractDataForScoring(geoid);
  }

  const row = result[0];
  const stateFips = normalizedGeoid.substring(0, 2);
  const stateMfi = await getStateMfi(stateFips);
  const mfiPct = row.mfi_pct || 100;
  const tractMfi = (mfiPct / 100) * stateMfi;

  return {
    geoid: normalizedGeoid,
    poverty_rate: row.poverty_rate || 0,
    median_family_income: tractMfi,
    unemployment_rate: row.unemployment_rate || 0,
    state_mfi: stateMfi,
    is_lic_eligible: row.is_lic_eligible,
    is_severely_distressed: row.is_severely_distressed,
    is_qct: row.is_qct,
    is_opportunity_zone: row.is_oz,
    is_persistent_poverty_county: row.is_severely_distressed && row.is_non_metro,
    is_non_metro: row.is_non_metro,
    is_high_migration: row.is_high_migration,
    state_name: row.state_name || '',
    county_name: row.county_name || '',
  };
}
