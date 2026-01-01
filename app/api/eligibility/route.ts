/**
 * Eligibility Check API - SOURCE OF TRUTH
 * ========================================
 * Uses: master_tax_credit_sot + tract_geometries (for point-in-polygon)
 *
 * GET /api/eligibility?tract=01001020100
 * GET /api/eligibility?lat=38.846&lng=-76.9275
 * GET /api/eligibility?address=4600 Silver Hill Rd, Washington, DC
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address');
  const debug = searchParams.get('debug') === 'true';

  try {
    const supabase = getSupabaseAdmin();
    let eligibilityData: Record<string, unknown> | null = null;
    let matchedAddress: string | null = null;
    let coordinates: [number, number] | null = null;

    // ===============================
    // Option 1: Direct GEOID lookup
    // ===============================
    if (tract) {
      const geoid = tract.replace(/[-\s]/g, '').padStart(11, '0');

      const { data, error } = await supabase
        .from('master_tax_credit_sot')
        .select('*')
        .eq('geoid', geoid)
        .single();

      if (error) {
        console.error('[Eligibility] GEOID lookup error:', error);
      }
      eligibilityData = data;
    }

    // ===============================
    // Option 2: Lat/Lng lookup (point-in-polygon)
    // ===============================
    else if (lat && lng) {
      coordinates = [parseFloat(lng), parseFloat(lat)];

      // Use RPC function for point-in-polygon
      const { data, error } = await supabase.rpc('get_tract_at_point' as never, {
        p_lat: coordinates[1],
        p_lng: coordinates[0]
      } as never);

      type RpcResult = { geoid: string }[];
      const rpcData = data as RpcResult | null;

      if (error) {
        console.error('[Eligibility] Point lookup error:', error);
      } else if (rpcData && rpcData.length > 0) {
        // Get full data from master_tax_credit_sot
        const { data: sotData } = await supabase
          .from('master_tax_credit_sot')
          .select('*')
          .eq('geoid', rpcData[0].geoid)
          .single();

        eligibilityData = sotData;
      }
    }

    // ===============================
    // Option 3: Address lookup (geocode then point-in-polygon)
    // ===============================
    else if (address) {
      // Census Bureau geocoder (free, no API key)
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
      const geocodeResponse = await fetch(geocodeUrl);

      if (!geocodeResponse.ok) {
        return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 });
      }

      const geocodeData = await geocodeResponse.json();
      const match = geocodeData?.result?.addressMatches?.[0];

      if (!match) {
        return NextResponse.json({
          found: false,
          error: 'Address not found',
          address
        }, { status: 404 });
      }

      matchedAddress = match.matchedAddress;
      coordinates = [match.coordinates.x, match.coordinates.y];

      // Use RPC for point-in-polygon
      const { data: rpcData2, error } = await supabase.rpc('get_tract_at_point' as never, {
        p_lat: coordinates[1],
        p_lng: coordinates[0]
      } as never);

      type RpcResult2 = { geoid: string }[];
      const tractData = rpcData2 as RpcResult2 | null;

      if (error) {
        console.error('[Eligibility] Address point lookup error:', error);
      } else if (tractData && tractData.length > 0) {
        // Get full data from master_tax_credit_sot
        const { data: sotData } = await supabase
          .from('master_tax_credit_sot')
          .select('*')
          .eq('geoid', tractData[0].geoid)
          .single();

        eligibilityData = sotData;
      }
    }

    else {
      return NextResponse.json({
        error: 'Provide tract, lat/lng, or address'
      }, { status: 400 });
    }

    // Not found
    if (!eligibilityData) {
      return NextResponse.json({
        found: false,
        eligible: false,
        has_any_tax_credit: false,
        programs: [],
        reason: 'Location not found in database',
        coordinates,
        matched_address: matchedAddress,
        source: 'master_tax_credit_sot'
      }, { status: 404 });
    }

    // Build response
    return NextResponse.json(formatEligibilityResponse(eligibilityData, coordinates, matchedAddress, debug));

  } catch (error) {
    console.error('[Eligibility] Error:', error);
    return NextResponse.json({
      error: 'Eligibility check failed',
      details: String(error)
    }, { status: 500 });
  }
}

function formatEligibilityResponse(
  data: Record<string, unknown>,
  coordinates: [number, number] | null,
  matchedAddress: string | null,
  debug: boolean
) {
  // Build programs array
  // Federal programs are qualifiers, State programs are bonuses (only if federal qualifies)
  const programs: string[] = [];

  // NMTC: Federal NMTC or High Migration are qualifiers, State NMTC is a bonus
  const isNmtcEligible = data.is_nmtc_eligible || data.is_nmtc_high_migration;
  if (data.is_nmtc_eligible) {
    programs.push('Federal NMTC');
  }
  if (data.is_nmtc_high_migration) {
    programs.push('High Migration NMTC');
  }
  // State NMTC is bonus only if Federal NMTC or High Migration eligible
  if (isNmtcEligible && data.has_state_nmtc) {
    programs.push('State NMTC');
  }

  // LIHTC: Federal QCT is the qualifier, State LIHTC and DDA are bonuses
  const isLihtcQct = data.is_lihtc_qct_2025 || data.is_lihtc_qct_2026;
  if (isLihtcQct) {
    if (data.is_lihtc_qct_2025) programs.push('LIHTC QCT 2025');
    if (data.is_lihtc_qct_2026) programs.push('LIHTC QCT 2026');
    // DDA is 30% boost - only relevant if QCT eligible
    if (data.is_dda_2025 || data.is_dda_2026) {
      programs.push('DDA (30% Boost)');
    }
    // State LIHTC is bonus only if QCT eligible
    if (data.has_state_lihtc) {
      programs.push('State LIHTC');
    }
  }

  // Opportunity Zone - standalone qualifier
  if (data.is_oz_designated) {
    programs.push('Opportunity Zone');
  }

  const geoid = data.geoid as string;

  const response: Record<string, unknown> = {
    found: true,
    tract: geoid,
    state_fips: geoid?.substring(0, 2),

    // Primary eligibility flag (recalculated without HTC/Brownfield)
    eligible: programs.length > 0,
    has_any_tax_credit: programs.length > 0,

    // All programs
    programs,
    program_count: programs.length,
    stack_score: data.stack_score,

    // Federal programs (normalized names for API consumers)
    federal: {
      nmtc_eligible: data.is_nmtc_eligible || false,
      lihtc_qct: data.is_lihtc_qct_2025 || data.is_lihtc_qct_2026 || false,
      lihtc_qct_2025: data.is_lihtc_qct_2025 || false,
      lihtc_qct_2026: data.is_lihtc_qct_2026 || false,
      lihtc_dda: data.is_dda_2025 || data.is_dda_2026 || false,
      lihtc_dda_2025: data.is_dda_2025 || false,
      lihtc_dda_2026: data.is_dda_2026 || false,
      opportunity_zone: data.is_oz_designated || false,
      poverty_rate: data.poverty_rate,
      poverty_qualifies: data.poverty_rate ? Number(data.poverty_rate) >= 20 : false,
      median_income_pct: data.mfi_percent,
      income_qualifies: data.mfi_percent ? Number(data.mfi_percent) <= 80 : false,
      unemployment_rate: data.unemployment_rate,
      severely_distressed: data.is_nmtc_eligible && (
        (data.poverty_rate && Number(data.poverty_rate) >= 30) ||
        (data.mfi_percent && Number(data.mfi_percent) <= 60)
      )
    },

    // State programs (NO HTC or Brownfield - not implemented yet)
    state: {
      nmtc: data.has_state_nmtc || false,
      lihtc: data.has_state_lihtc || false,
    },

    // Reason
    reason: programs.length > 0
      ? 'Qualifies for one or more tax credit programs'
      : 'Does not qualify for any tax credit programs',

    source: 'master_tax_credit_sot'
  };

  if (coordinates) response.coordinates = coordinates;
  if (matchedAddress) response.matched_address = matchedAddress;

  if (debug) {
    response._debug = {
      raw_data: data,
      timestamp: new Date().toISOString()
    };
  }

  return response;
}
