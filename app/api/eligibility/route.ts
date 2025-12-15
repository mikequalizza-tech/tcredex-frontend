import { NextRequest, NextResponse } from 'next/server';
import { lookupTract } from '@/lib/tracts/tractData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');

  if (!tract) {
    return NextResponse.json({ error: 'Census tract required' }, { status: 400 });
  }

  const cleanTract = tract.replace(/[-\s]/g, '').padStart(11, '0');

  try {
    // Look up in our real tract database
    const tractData = await lookupTract(cleanTract);

    if (tractData && tractData.eligible) {
      // Found in eligible tracts
      const programs: string[] = ['NMTC'];
      if (tractData.severelyDistressed) programs.push('Severely Distressed');
      if (tractData.povertyQualifies && tractData.incomeQualifies) programs.push('High Priority');

      return NextResponse.json({
        eligible: true,
        tract: cleanTract,
        programs,
        povertyRate: tractData.poverty,
        medianIncomePct: tractData.income,
        unemployment: tractData.unemployment,
        reason: 'Qualifies as NMTC Low-Income Community',
        details: {
          qualifiesOnPoverty: tractData.povertyQualifies,
          qualifiesOnIncome: tractData.incomeQualifies,
          state: tractData.state,
          county: tractData.county,
          classification: tractData.classification
        }
      });
    }

    // Not in eligible tracts database
    return NextResponse.json({
      eligible: false,
      tract: cleanTract,
      programs: [],
      povertyRate: null,
      medianIncomePct: null,
      reason: 'Census tract does not meet NMTC Low-Income Community criteria',
      note: 'Verify at https://www.cdfifund.gov/research-data/nmtc-mapping-tool'
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json({
      eligible: false,
      tract: cleanTract,
      programs: [],
      povertyRate: null,
      medianIncomePct: null,
      reason: 'Error checking eligibility',
      note: 'Please try again or verify at cdfifund.gov'
    }, { status: 500 });
  }
}
