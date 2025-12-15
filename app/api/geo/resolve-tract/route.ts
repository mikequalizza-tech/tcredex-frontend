import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/geo/resolve-tract
 * 
 * Resolve an address or coordinates to a census tract ID (GEOID)
 * 
 * Query params:
 * - address: Full address string (geocodes first, then resolves tract)
 * - lat & lng: Coordinates (resolves tract directly)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    let latitude: number;
    let longitude: number;

    // Option 1: Coordinates provided directly
    if (lat && lng) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid coordinates' },
          { status: 400 }
        );
      }
    }
    // Option 2: Address provided - geocode first
    else if (address) {
      const geocodeResult = await geocodeAddress(address);
      if (!geocodeResult) {
        return NextResponse.json(
          { error: 'Unable to geocode address' },
          { status: 404 }
        );
      }
      latitude = geocodeResult.lat;
      longitude = geocodeResult.lng;
    }
    // Neither provided
    else {
      return NextResponse.json(
        { error: 'Provide either address or lat/lng coordinates' },
        { status: 400 }
      );
    }

    // Resolve coordinates to census tract
    const tractResult = await resolveCoordinatesToTract(latitude, longitude);
    
    if (!tractResult) {
      return NextResponse.json(
        { error: 'Unable to determine census tract for location' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tract_id: tractResult.geoid,
      state_fips: tractResult.stateFips,
      county_fips: tractResult.countyFips,
      tract_code: tractResult.tractCode,
      lat: latitude,
      lng: longitude
    });

  } catch (error) {
    console.error('[GeoAPI] Error resolving tract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Geocode an address using Census Bureau Geocoder
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Try Census Bureau Geocoder first (free, no API key needed)
    const encodedAddress = encodeURIComponent(address);
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodedAddress}&benchmark=Public_AR_Current&format=json`;
    
    const response = await fetch(censusUrl);
    const data = await response.json();
    
    const match = data.result?.addressMatches?.[0];
    if (match?.coordinates) {
      return {
        lat: match.coordinates.y,
        lng: match.coordinates.x
      };
    }

    // Fallback: Try Google Geocoding if available
    const googleApiKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (googleApiKey) {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}`;
      const googleResponse = await fetch(googleUrl);
      const googleData = await googleResponse.json();
      
      if (googleData.results?.[0]?.geometry?.location) {
        return {
          lat: googleData.results[0].geometry.location.lat,
          lng: googleData.results[0].geometry.location.lng
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[GeoAPI] Geocoding error:', error);
    return null;
  }
}

/**
 * Resolve coordinates to census tract using Census Bureau API
 */
async function resolveCoordinatesToTract(lat: number, lng: number): Promise<{
  geoid: string;
  stateFips: string;
  countyFips: string;
  tractCode: string;
} | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`;
    
    const response = await fetch(url);
    const data = await response.json();

    const tractInfo = data.result?.geographies?.['Census Tracts']?.[0];
    if (!tractInfo) {
      return null;
    }

    const stateFips = tractInfo.STATE;
    const countyFips = tractInfo.COUNTY;
    const tractCode = tractInfo.TRACT;
    const geoid = `${stateFips}${countyFips}${tractCode}`;

    return {
      geoid,
      stateFips,
      countyFips,
      tractCode
    };
  } catch (error) {
    console.error('[GeoAPI] Tract resolution error:', error);
    return null;
  }
}
