import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address');

  // If we have an address, geocode it first
  if (address) {
    try {
      // Use Census Bureau address geocoder
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      
      if (!geocodeResponse.ok) {
        return NextResponse.json({ 
          error: 'Geocoding service unavailable',
          geoid: null 
        }, { status: 503 });
      }
      
      const geocodeData = await geocodeResponse.json();
      
      // Check for address matches
      const addressMatches = geocodeData?.result?.addressMatches;
      
      if (!addressMatches || addressMatches.length === 0) {
        return NextResponse.json({ 
          error: 'Address not found. Please check the address and try again.',
          geoid: null 
        }, { status: 404 });
      }

      const match = addressMatches[0];
      const tractInfo = match.geographies?.['Census Tracts']?.[0];
      
      if (!tractInfo) {
        return NextResponse.json({ 
          error: 'Census tract not found for this address',
          geoid: null 
        }, { status: 404 });
      }

      const geoid = `${tractInfo.STATE}${tractInfo.COUNTY}${tractInfo.TRACT}`;
      
      return NextResponse.json({
        geoid,
        tract_id: geoid,
        state_fips: tractInfo.STATE,
        county_fips: tractInfo.COUNTY,
        tract_code: tractInfo.TRACT,
        state_name: tractInfo.STUSAB || null,
        county_name: tractInfo.COUNTYNAME || tractInfo.COUNTY,
        matched_address: match.matchedAddress,
        coordinates: [match.coordinates.x, match.coordinates.y],
        source: 'census_address'
      });
      
    } catch (error) {
      console.error('Address geocoding error:', error);
      return NextResponse.json({ 
        error: 'Failed to geocode address',
        geoid: null 
      }, { status: 500 });
    }
  }

  // Original lat/lng lookup
  if (!lat || !lng) {
    return NextResponse.json({ 
      error: 'Either address OR lat and lng parameters required',
      geoid: null 
    }, { status: 400 });
  }

  try {
    // Try Census Bureau Geocoder first (most accurate for tracts)
    const censusResponse = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?` +
      `x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`
    );
    
    if (censusResponse.ok) {
      const censusData = await censusResponse.json();
      const geographies = censusData?.result?.geographies;
      
      if (geographies?.['Census Tracts']?.[0]) {
        const tractInfo = geographies['Census Tracts'][0];
        const geoid = tractInfo.STATE + tractInfo.COUNTY + tractInfo.TRACT;
        
        return NextResponse.json({
          geoid,
          tract_id: geoid,
          state_fips: tractInfo.STATE,
          county_fips: tractInfo.COUNTY,
          tract_code: tractInfo.TRACT,
          coordinates: [parseFloat(lng), parseFloat(lat)],
          source: 'census_coordinates'
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
        const geoid = fccData.Block.FIPS.substring(0, 11);
        
        return NextResponse.json({
          geoid,
          tract_id: geoid,
          state_fips: fccData.State?.FIPS || geoid.substring(0, 2),
          county_fips: fccData.County?.FIPS || geoid.substring(2, 5),
          tract_code: geoid.substring(5, 11),
          state_name: fccData.State?.name,
          county_name: fccData.County?.name,
          coordinates: [parseFloat(lng), parseFloat(lat)],
          source: 'fcc'
        });
      }
    }

    return NextResponse.json({ 
      geoid: null, 
      error: 'Could not resolve census tract for these coordinates' 
    }, { status: 404 });

  } catch (error) {
    console.error('Census tract lookup error:', error);
    return NextResponse.json({ 
      geoid: null, 
      error: 'Failed to lookup census tract' 
    }, { status: 500 });
  }
}
