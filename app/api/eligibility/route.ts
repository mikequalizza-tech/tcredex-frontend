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
      .select('geoid')
      .limit(5);
    debugInfo.sampleGeoids = sampleData?.map(d => d.geoid);
    debugInfo.sampleError = sampleError?.message;

    // Try padded query
    let { data: tractData, error: tractError } = await supabaseAdmin
      .from('census_tracts')
      .select('*')
      .eq('geoid', cleanTract)
      .single();
    
    debugInfo.paddedQueryFound = !!tractData;
    debugInfo.paddedQueryError = tractError?.code;

    // If not found, try unpadded
    if (!tractData && tractError?.code === 'PGRST116') {
      const result = await supabaseAdmin
        .from('census_tracts')
        .select('*')
        .eq('geoid', unpadded)
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
          geoid: tractData.geoid,
          state_name: tractData.state_name,
          nmtc_eligible: tractData.nmtc_eligible,
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
    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('state_credit_matrix')
      .select('*')
      .eq('state_name', tractData.state_name)
      .single();

    if (stateError && stateError.code !== 'PGRST116') {
      console.error('State credit query error:', stateError);
    }

    // Build programs list
    const programs: string[] = [];
    
    if (tractData.nmtc_eligible) {
      programs.push('Federal NMTC');
      if (tractData.poverty_qualifies && tractData.income_qualifies) {
        programs.push('Severely Distressed');
      }
    }

    if (stateData?.is_state_nmtc) programs.push('State NMTC');
    if (stateData?.is_state_htc) programs.push('State HTC');
    if (stateData?.is_state_brownfield) programs.push('Brownfield Credit');

    return NextResponse.json({
      eligible: tractData.nmtc_eligible || false,
      tract: cleanTract,
      programs,
      federal: {
        nmtc_eligible: tractData.nmtc_eligible,
        poverty_rate: tractData.poverty_rate,
        poverty_qualifies: tractData.poverty_qualifies,
        median_income_pct: tractData.median_income_pct,
        income_qualifies: tractData.income_qualifies,
        unemployment_rate: tractData.unemployment_rate,
        unemployment_qualifies: tractData.unemployment_qualifies,
        classification: tractData.classification
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
        state: tractData.state_name,
        county: tractData.county_name
      },
      reason: tractData.nmtc_eligible 
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
