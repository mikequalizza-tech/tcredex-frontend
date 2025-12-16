import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, CensusTract, StateCredit } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');

  if (!tract) {
    return NextResponse.json({ error: 'Census tract required' }, { status: 400 });
  }

  const cleanTract = tract.replace(/[-\s]/g, '').padStart(11, '0');
  const unpadded = tract.replace(/[-\s]/g, '').replace(/^0+/, ''); // Remove leading zeros
  
  console.log('=== ELIGIBILITY API DEBUG ===' );
  console.log('Input tract:', tract);
  console.log('Clean tract (padded):', cleanTract);
  console.log('Unpadded tract:', unpadded);

  try {
    // Debug: Check if table has data
    const { count, error: countError } = await supabaseAdmin
      .from('census_tracts')
      .select('*', { count: 'exact', head: true });
    console.log('Total rows in census_tracts:', count, countError ? `Error: ${countError.message}` : '');

    // Debug: Check sample data format
    const { data: sampleData } = await supabaseAdmin
      .from('census_tracts')
      .select('geoid')
      .limit(5);
    console.log('Sample GEOIDs in database:', sampleData?.map(d => d.geoid));

    // Try padded first
    let { data: tractData, error: tractError } = await supabaseAdmin
      .from('census_tracts')
      .select('*')
      .eq('geoid', cleanTract)
      .single();

    console.log('Padded query result:', { found: !!tractData, error: tractError?.code });

    // If not found, try unpadded
    if (!tractData && tractError?.code === 'PGRST116') {
      console.log('Trying unpadded query...');
      const result = await supabaseAdmin
        .from('census_tracts')
        .select('*')
        .eq('geoid', unpadded)
        .single();
      tractData = result.data;
      tractError = result.error;
      console.log('Unpadded query result:', { found: !!tractData, error: tractError?.code });
    }

    if (tractError && tractError.code !== 'PGRST116') {
      // PGRST116 = not found, other errors are real problems
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
      // Don't fail - just proceed without state data
    }

    // Build programs list
    const programs: string[] = [];
    
    // Federal NMTC
    if (tractData.nmtc_eligible) {
      programs.push('Federal NMTC');
      if (tractData.poverty_qualifies && tractData.income_qualifies) {
        programs.push('Severely Distressed');
      }
    }

    // State credits
    if (stateData?.is_state_nmtc) programs.push('State NMTC');
    if (stateData?.is_state_htc) programs.push('State HTC');
    if (stateData?.is_state_brownfield) programs.push('Brownfield Credit');

    // Build response
    return NextResponse.json({
      eligible: tractData.nmtc_eligible || false,
      tract: cleanTract,
      programs,
      
      // Federal data
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
      
      // State data
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

      // Location
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
      note: 'Please try again or verify at cdfifund.gov'
    }, { status: 500 });
  }
}
