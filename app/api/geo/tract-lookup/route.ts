import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    // Try Census Bureau Geocoder first (most accurate for tracts)
    const censusResponse = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?` +
      `x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
    );
    
    if (censusResponse.ok) {
      const censusData = await censusResponse.json();
      const geographies = censusData?.result?.geographies;
      
      if (geographies?.['Census Tracts']?.[0]) {
        const tractInfo = geographies['Census Tracts'][0];
        const tractId = tractInfo.STATE + tractInfo.COUNTY + tractInfo.TRACT;
        
        return NextResponse.json({
          tract_id: tractId.padStart(11, '0'),
          state_fips: tractInfo.STATE,
          county_fips: tractInfo.COUNTY,
          tract_code: tractInfo.TRACT,
          source: 'census_bureau'
        });
      }
    }

    // Fallback to FCC API
    const fccResponse = await fetch(
      `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`
    );
    
    if (fccResponse.ok) {
      const fccData = await fccResponse.json();
      
      if (fccData.Block?.FIPS) {
        // FIPS is 15 digits: State(2) + County(3) + Tract(6) + Block(4)
        const tractId = fccData.Block.FIPS.substring(0, 11);
        
        return NextResponse.json({
          tract_id: tractId,
          state_fips: fccData.State?.FIPS || tractId.substring(0, 2),
          county_fips: fccData.County?.FIPS || tractId.substring(2, 5),
          tract_code: tractId.substring(5, 11),
          state_name: fccData.State?.name,
          county_name: fccData.County?.name,
          source: 'fcc'
        });
      }
    }

    return NextResponse.json({ 
      tract_id: null, 
      error: 'Could not resolve census tract' 
    });

  } catch (error) {
    console.error('Census tract lookup error:', error);
    return NextResponse.json({ 
      tract_id: null, 
      error: 'Failed to lookup census tract' 
    }, { status: 500 });
  }
}
