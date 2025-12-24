import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * NMTC Eligibility Check API
 * 
 * GET /api/eligibility?tract=01001020100
 * GET /api/eligibility?tract=01001020100&debug=true
 * 
 * Handles both padded (11-char) and unpadded (10-char) GEOIDs
 * because Census TigerWeb uses leading zeros, Excel/imports often don't.
 */

// Fallback mock eligibility data when census_tracts table doesn't exist
function getMockEligibility(geoid: string): {
  eligible: boolean;
  programs: string[];
  severelyDistressed: boolean;
  povertyRate: number;
  mfi: number;
} {
  // Simple deterministic mock based on GEOID hash
  const hash = geoid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const eligible = hash % 3 !== 0; // ~66% eligible
  const severelyDistressed = hash % 5 === 0; // ~20% severely distressed
  
  return {
    eligible,
    programs: eligible ? ['NMTC'] : [],
    severelyDistressed,
    povertyRate: 15 + (hash % 25),
    mfi: 50 + (hash % 40),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');
  const debug = searchParams.get('debug') === 'true';

  if (!tract) {
    return NextResponse.json({ error: 'Census tract required' }, { status: 400 });
  }

  // Clean the tract - remove dashes/spaces
  const inputTract = tract.replace(/[-\s]/g, '');
  
  // Create multiple search variants to handle GEOID format mismatches
  const variants = [
    inputTract,                                    // As-is
    inputTract.padStart(11, '0'),                  // Pad to 11 chars
    inputTract.replace(/^0+/, ''),                 // Strip leading zeros
    parseInt(inputTract, 10).toString(),           // Parse as int then back to string
  ];
  
  // Remove duplicates
  const uniqueVariants = [...new Set(variants)];
  
  const debugInfo: Record<string, unknown> = {
    input: tract,
    variants: uniqueVariants,
  };

  try {
    // Check table exists and get sample
    const { count, error: countError } = await supabaseAdmin
      .from('census_tracts')
      .select('*', { count: 'exact', head: true });
    
    debugInfo.tableRowCount = count;
    
    if (countError) {
      // Table doesn't exist - use mock data
      console.log('[Eligibility] census_tracts table not found, using mock data');
      const mock = getMockEligibility(inputTract);
      return NextResponse.json({
        eligible: mock.eligible,
        tract: inputTract,
        programs: mock.programs,
        severelyDistressed: mock.severelyDistressed,
        povertyRate: mock.povertyRate,
        mfi: mock.mfi,
        federal: {
          nmtc: { eligible: mock.eligible },
          poverty_rate: mock.povertyRate,
          mfi_percent: mock.mfi,
        },
        state: null,
        location: { state: 'Unknown', county: 'Unknown' },
        reason: mock.eligible ? 'Mock: Qualifies as NMTC Low-Income Community' : 'Mock: Does not meet NMTC criteria',
        _mock: true,
        _note: 'Using mock data - census_tracts table not yet populated',
      });
    }

    // Get sample to see actual GEOID format in DB
    const { data: sampleData } = await supabaseAdmin
      .from('census_tracts')
      .select('GEOID')
      .limit(3);
    
    debugInfo.sampleGeoids = sampleData?.map(d => ({
      value: d.GEOID,
      type: typeof d.GEOID,
      length: String(d.GEOID).length,
    }));

    // Try each variant until we find a match
    let tractData: Record<string, unknown> | null = null;
    let matchedVariant: string | null = null;

    for (const variant of uniqueVariants) {
      // Try as string
      const { data: stringResult, error: stringError } = await supabaseAdmin
        .from('census_tracts')
        .select('*')
        .eq('GEOID', variant)
        .maybeSingle();
      
      if (stringResult) {
        tractData = stringResult;
        matchedVariant = `string:${variant}`;
        break;
      }

      // Try as number (if it's a numeric GEOID stored as integer)
      const numericVariant = parseInt(variant, 10);
      if (!isNaN(numericVariant)) {
        const { data: numResult } = await supabaseAdmin
          .from('census_tracts')
          .select('*')
          .eq('GEOID', numericVariant)
          .maybeSingle();
        
        if (numResult) {
          tractData = numResult;
          matchedVariant = `number:${numericVariant}`;
          break;
        }
      }
    }

    debugInfo.matchedVariant = matchedVariant;
    debugInfo.tractFound = !!tractData;

    // Debug mode - return diagnostic info
    if (debug) {
      return NextResponse.json({
        debug: true,
        ...debugInfo,
        tractData: tractData ? {
          GEOID: tractData.GEOID,
          GEOID_type: typeof tractData.GEOID,
          state_name: tractData.state_name,
          is_nmtc_lic: tractData.is_nmtc_lic,
          is_nmtc_lic_type: typeof tractData.is_nmtc_lic,
          poverty_rate_pct: tractData.poverty_rate_pct,
          poverty_qualifies: tractData.poverty_qualifies,
          mfi_pct: tractData.mfi_pct,
          mfi_qualifies: tractData.mfi_qualifies,
          // Show all columns for diagnosis
          all_columns: Object.keys(tractData),
        } : null,
      });
    }

    // If no tract found
    if (!tractData) {
      return NextResponse.json({
        eligible: false,
        tract: inputTract,
        programs: [],
        federal: null,
        state: null,
        reason: 'Census tract not found in database',
        note: 'Verify at https://www.cdfifund.gov/research-data/nmtc-mapping-tool',
        _debug: { variantsTried: uniqueVariants },
      });
    }

    // Query state_credit_matrix for state-level credits
    const stateName = String(tractData.state_name || '').trim();
    const { data: stateData } = await supabaseAdmin
      .from('state_credit_matrix')
      .select('*')
      .eq('state_name', stateName)
      .maybeSingle();

    // ========================================================================
    // ROBUST BOOLEAN PARSING
    // Handle: 'YES', 'Yes', 'yes', 'Y', 1, true, 'TRUE', 'true', etc.
    // ========================================================================
    function isYes(val: unknown): boolean {
      if (val === true || val === 1) return true;
      if (typeof val === 'string') {
        const upper = val.toUpperCase().trim();
        return upper === 'YES' || upper === 'Y' || upper === 'TRUE' || upper === '1';
      }
      return false;
    }

    const isNmtcEligible = isYes(tractData.is_nmtc_lic);
    const povertyRate = parseFloat(String(tractData.poverty_rate_pct)) || 0;
    const medianIncomePct = parseFloat(String(tractData.mfi_pct)) || 0;
    const unemploymentRate = parseFloat(String(tractData.unemployment_rate_pct)) || 0;
    
    const povertyQualifies = isYes(tractData.poverty_qualifies);
    const incomeQualifies = isYes(tractData.mfi_qualifies);
    const unemploymentQualifies = isYes(tractData.unemployment_ratio_qualifies);
    const isSeverelyDistressed = povertyQualifies || incomeQualifies || unemploymentQualifies;
    const isOzDesignated = isYes(tractData.oz_designated);

    // Build programs list
    const programs: string[] = [];
    
    if (isNmtcEligible) {
      programs.push('Federal NMTC');
      if (isSeverelyDistressed) {
        programs.push('Severely Distressed');
      }
    }

    if (stateData?.is_state_nmtc) programs.push('State NMTC');
    if (stateData?.is_state_htc) programs.push('State HTC');
    if (stateData?.is_state_brownfield) programs.push('Brownfield Credit');
    if (isOzDesignated) programs.push('Opportunity Zone');

    return NextResponse.json({
      eligible: isNmtcEligible,
      tract: inputTract,
      programs,
      federal: {
        nmtc_eligible: isNmtcEligible,
        poverty_rate: povertyRate,
        poverty_qualifies: povertyQualifies,
        median_income_pct: medianIncomePct,
        income_qualifies: incomeQualifies,
        unemployment_rate: unemploymentRate,
        unemployment_qualifies: unemploymentQualifies,
        severely_distressed: isSeverelyDistressed,
        metro_status: tractData.omb_metro_non_metro,
        opportunity_zone: isOzDesignated
      },
      state: stateData ? {
        state_name: stateData.state_name,
        nmtc: {
          available: isYes(stateData.is_state_nmtc),
          transferable: stateData.is_state_nmtc_transferable,
          refundable: stateData.is_state_nmtc_refundable,
          notes: stateData.state_nmtc_notes_url
        },
        htc: {
          available: isYes(stateData.is_state_htc),
          transferable: stateData.is_state_htc_transferable,
          refundable: stateData.is_state_htc_refundable,
          notes: stateData.state_htc_notes_url
        },
        brownfield: {
          available: isYes(stateData.is_state_brownfield),
          transferable: stateData.is_state_brownfield_transferable,
          refundable: stateData.is_state_brownfield_refundable,
          notes: stateData.state_brownfield_notes_url
        },
        stacking_notes: stateData.stacking_notes,
        credit_tags: stateData.state_credit_tags
      } : null,
      location: {
        state: stateName,
        county: tractData.county_name || 'Unknown'
      },
      reason: isNmtcEligible 
        ? 'Qualifies as NMTC Low-Income Community'
        : 'Does not meet NMTC Low-Income Community criteria'
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    // Fall back to mock data on any error
    const mock = getMockEligibility(inputTract);
    return NextResponse.json({
      eligible: mock.eligible,
      tract: inputTract,
      programs: mock.programs,
      severelyDistressed: mock.severelyDistressed,
      povertyRate: mock.povertyRate,
      mfi: mock.mfi,
      federal: {
        nmtc: { eligible: mock.eligible },
        poverty_rate: mock.povertyRate,
        mfi_percent: mock.mfi,
      },
      state: null,
      location: { state: 'Unknown', county: 'Unknown' },
      reason: mock.eligible ? 'Mock: Qualifies as NMTC Low-Income Community' : 'Mock: Does not meet NMTC criteria',
      _mock: true,
      _error: String(error),
    });
  }
}
