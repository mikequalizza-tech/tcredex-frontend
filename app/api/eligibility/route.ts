import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');
  const debug = searchParams.get('debug') === 'true';

  if (!tract) {
    return NextResponse.json({ error: 'Census tract required' }, { status: 400 });
  }

  const cleanTract = tract.replace(/[-\s]/g, '').padStart(11, '0');
  const unpadded = tract.replace(/[-\s]/g, '').replace(/^0+/, '');
  
  const debugInfo: Record<string, unknown> = {
    input: tract,
    cleanTract,
    unpadded,
  };

  try {
    // Check table row count
    const { count, error: countError } = await supabaseAdmin
      .from('census_tracts')
      .select('*', { count: 'exact', head: true });
    debugInfo.tableRowCount = count;
    debugInfo.countError = countError?.message;

    // Get sample GEOIDs to see format
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('census_tracts')
      .select('GEOID')
      .limit(5);
    debugInfo.sampleGeoids = sampleData?.map(d => d.GEOID);
    debugInfo.sampleError = sampleError?.message;

    // Try padded query
    let { data: tractData, error: tractError } = await supabaseAdmin
      .from('census_tracts')
      .select('*')
      .eq('GEOID', cleanTract)
      .single();
    
    debugInfo.paddedQueryFound = !!tractData;
    debugInfo.paddedQueryError = tractError?.code;

    // If not found, try unpadded
    if (!tractData && tractError?.code === 'PGRST116') {
      const result = await supabaseAdmin
        .from('census_tracts')
        .select('*')
        .eq('GEOID', unpadded)
        .single();
      tractData = result.data;
      tractError = result.error;
      debugInfo.unpaddedQueryFound = !!tractData;
      debugInfo.unpaddedQueryError = tractError?.code;
    }

    // If debug mode, return diagnostic info
    if (debug) {
      return NextResponse.json({
        debug: true,
        ...debugInfo,
        tractDataFound: !!tractData,
        tractData: tractData ? {
          GEOID: tractData.GEOID,
          state_name: tractData.state_name,
          county_fips: tractData.county_fips,
          is_nmtc_lic: tractData.is_nmtc_lic,
          poverty_rate_pct: tractData.poverty_rate_pct,
          poverty_qualifies: tractData.poverty_qualifies,
          mfi_pct: tractData.mfi_pct,
          mfi_qualifies: tractData.mfi_qualifies,
          unemployment_rate_pct: tractData.unemployment_rate_pct,
          unemployment_ratio_qualifies: tractData.unemployment_ratio_qualifies,
          omb_metro_non_metro: tractData.omb_metro_non_metro,
        } : null,
      });
    }

    if (tractError && tractError.code !== 'PGRST116') {
      console.error('Census tract query error:', tractError);
      throw tractError;
    }

    // If no tract found
    if (!tractData) {
      return NextResponse.json({
        eligible: false,
        tract: cleanTract,
        programs: [],
        federal: null,
        state: null,
        reason: 'Census tract not found in database',
        note: 'Verify at https://www.cdfifund.gov/research-data/nmtc-mapping-tool'
      });
    }

    // Query state_credit_matrix for state-level credits
    const stateName = (tractData.state_name || '').trim();
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('state_credit_matrix')
      .select('*')
      .eq('state_name', stateName)
      .single();

    if (stateError && stateError.code !== 'PGRST116') {
      console.error('State credit query error:', stateError);
    }

    // Map actual column names (is_nmtc_lic is text 'YES'/'NO')
    const isNmtcEligible = tractData.is_nmtc_lic === 'YES';
    const povertyRate = parseFloat(tractData.poverty_rate_pct) || 0;
    const medianIncomePct = parseFloat(tractData.mfi_pct) || 0;
    const unemploymentRate = parseFloat(tractData.unemployment_rate_pct) || 0;
    
    // Use database qualifies columns directly (text 'YES'/'NO')
    const povertyQualifies = tractData.poverty_qualifies === 'YES';
    const incomeQualifies = tractData.mfi_qualifies === 'YES';
    const unemploymentQualifies = tractData.unemployment_ratio_qualifies === 'YES';
    const isSeverelyDistressed = povertyQualifies || incomeQualifies || unemploymentQualifies;
    const isOzDesignated = tractData.oz_designated === true;

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
      tract: cleanTract,
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
          available: stateData.is_state_nmtc || false,
          transferable: stateData.is_state_nmtc_transferable,
          refundable: stateData.is_state_nmtc_refundable,
          notes: stateData.state_nmtc_notes_url
        },
        htc: {
          available: stateData.is_state_htc || false,
          transferable: stateData.is_state_htc_transferable,
          refundable: stateData.is_state_htc_refundable,
          notes: stateData.state_htc_notes_url
        },
        brownfield: {
          available: stateData.is_state_brownfield || false,
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
    return NextResponse.json({
      eligible: false,
      tract: cleanTract,
      programs: [],
      federal: null,
      state: null,
      reason: 'Error checking eligibility',
      note: 'Please try again or verify at cdfifund.gov',
      ...(debug ? { debug: debugInfo, error: String(error) } : {})
    }, { status: 500 });
  }
}
