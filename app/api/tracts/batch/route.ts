import { NextRequest, NextResponse } from 'next/server';
import { lookupTracts } from '@/lib/tracts/tractData';

/**
 * POST /api/tracts/batch
 * 
 * Look up multiple tracts by GEOID in a single request
 * 
 * Request body: { geoids: ["17031010100", "17031010201", ...] }
 * Response: { results: { "17031010100": {...}, ... }, notFound: ["..."] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geoids } = body;

    if (!geoids || !Array.isArray(geoids)) {
      return NextResponse.json(
        { error: 'Request body must contain geoids array' },
        { status: 400 }
      );
    }

    if (geoids.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 GEOIDs per request' },
        { status: 400 }
      );
    }

    // Normalize GEOIDs
    const normalizedGeoids = geoids.map((g: string) => 
      String(g).replace(/\D/g, '').padStart(11, '0')
    );

    // Batch lookup
    const results = await lookupTracts(normalizedGeoids);

    // Build response
    const found: Record<string, object> = {};
    const notFound: string[] = [];

    for (const geoid of normalizedGeoids) {
      const tract = results.get(geoid);
      if (tract) {
        found[geoid] = {
          state: tract.state,
          stateAbbr: tract.stateAbbr,
          county: tract.county,
          poverty: tract.poverty,
          income: tract.income,
          unemployment: tract.unemployment,
          povertyQualifies: tract.povertyQualifies,
          incomeQualifies: tract.incomeQualifies,
          eligible: tract.eligible,
          severelyDistressed: tract.severelyDistressed,
          classification: tract.classification
        };
      } else {
        notFound.push(geoid);
      }
    }

    return NextResponse.json({
      requested: normalizedGeoids.length,
      found: Object.keys(found).length,
      results: found,
      notFound: notFound.length > 0 ? notFound : undefined
    });

  } catch (error) {
    console.error('[TractBatch] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracts/batch?geoids=17031010100,17031010201
 * 
 * Alternative GET method for smaller batch lookups
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoidsParam = searchParams.get('geoids');

  if (!geoidsParam) {
    return NextResponse.json(
      { error: 'geoids parameter required (comma-separated)', example: '/api/tracts/batch?geoids=17031010100,17031010201' },
      { status: 400 }
    );
  }

  const geoids = geoidsParam.split(',').map(g => g.trim()).filter(Boolean);

  if (geoids.length > 100) {
    return NextResponse.json(
      { error: 'Maximum 100 GEOIDs via GET. Use POST for larger batches.' },
      { status: 400 }
    );
  }

  // Normalize and lookup
  const normalizedGeoids = geoids.map(g => g.replace(/\D/g, '').padStart(11, '0'));
  const results = await lookupTracts(normalizedGeoids);

  const found: Record<string, object> = {};
  const notFound: string[] = [];

  for (const geoid of normalizedGeoids) {
    const tract = results.get(geoid);
    if (tract) {
      found[geoid] = {
        state: tract.state,
        stateAbbr: tract.stateAbbr,
        county: tract.county,
        poverty: tract.poverty,
        income: tract.income,
        unemployment: tract.unemployment,
        eligible: tract.eligible,
        severelyDistressed: tract.severelyDistressed,
        classification: tract.classification
      };
    } else {
      notFound.push(geoid);
    }
  }

  return NextResponse.json({
    requested: normalizedGeoids.length,
    found: Object.keys(found).length,
    results: found,
    notFound: notFound.length > 0 ? notFound : undefined
  });
}
