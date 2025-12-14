import { NextRequest, NextResponse } from 'next/server';
import { lookupTract, STATE_FIPS } from '@/lib/tracts/tractData';

/**
 * GET /api/tracts/lookup?geoid=17031010100
 * 
 * Look up NMTC eligibility data for a census tract by GEOID
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoid = searchParams.get('geoid');

  if (!geoid) {
    return NextResponse.json(
      { error: 'GEOID parameter required', example: '/api/tracts/lookup?geoid=17031010100' },
      { status: 400 }
    );
  }

  // Normalize GEOID (pad to 11 chars if needed)
  const normalizedGeoid = geoid.replace(/\D/g, '').padStart(11, '0');
  
  if (normalizedGeoid.length !== 11) {
    return NextResponse.json(
      { error: 'Invalid GEOID format. Must be 11 digits (state + county + tract)', geoid: normalizedGeoid },
      { status: 400 }
    );
  }

  try {
    // Look up in our eligibility database
    const tractData = await lookupTract(normalizedGeoid);
    
    if (tractData) {
      // Found in eligible tracts database
      return NextResponse.json({
        geoid: tractData.geoid,
        state: tractData.state,
        stateAbbr: tractData.stateAbbr,
        county: tractData.county,
        poverty: tractData.poverty,
        income: tractData.income,
        unemployment: tractData.unemployment,
        povertyQualifies: tractData.povertyQualifies,
        incomeQualifies: tractData.incomeQualifies,
        eligible: tractData.eligible,
        severelyDistressed: tractData.severelyDistressed,
        classification: tractData.classification
      });
    }
    
    // Not in eligible tracts - return not eligible
    const stateFips = normalizedGeoid.substring(0, 2);
    const stateName = STATE_FIPS[stateFips] || 'Unknown';
    
    return NextResponse.json({
      geoid: normalizedGeoid,
      state: stateName,
      stateAbbr: stateFips,
      county: 'Unknown',
      poverty: null,
      income: null,
      unemployment: null,
      povertyQualifies: false,
      incomeQualifies: false,
      eligible: false,
      severelyDistressed: false,
      classification: 'Neither',
      _note: 'Tract not found in NMTC eligible tracts database'
    });
    
  } catch (error) {
    console.error('[TractLookup] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', geoid: normalizedGeoid },
      { status: 500 }
    );
  }
}
