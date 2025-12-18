import { NextRequest, NextResponse } from 'next/server';

// Census TIGERweb ACS 2023 Tracts layer (updated from 2021)
const TIGERWEB_URLS = [
  // Try multiple endpoints in case one is down
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2023/MapServer/8/query',
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer/8/query',
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query',
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_ACS/MapServer/0/query',
];

async function fetchFromTigerWeb(queryParams: Record<string, string>): Promise<any> {
  const queryString = new URLSearchParams(queryParams).toString();
  
  for (const baseUrl of TIGERWEB_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(`${baseUrl}?${queryString}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'tCredex/1.0',
        },
        signal: controller.signal,
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`TIGERweb ${baseUrl} returned ${response.status}`);
        continue;
      }

      const text = await response.text();
      
      // Check if response is actually JSON (sometimes returns HTML error pages)
      if (text.startsWith('<') || text.startsWith('<!')) {
        console.log(`TIGERweb ${baseUrl} returned HTML instead of JSON`);
        continue;
      }

      const data = JSON.parse(text);
      
      if (data.features && data.features.length > 0) {
        console.log(`TIGERweb success from ${baseUrl}`);
        return data;
      }
    } catch (error) {
      console.log(`TIGERweb ${baseUrl} error:`, error instanceof Error ? error.message : 'Unknown');
      continue;
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoid = searchParams.get('geoid');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Either get tract by GEOID or by lat/lng point
  if (!geoid && (!lat || !lng)) {
    return NextResponse.json(
      { error: 'Either geoid or lat/lng required' },
      { status: 400 }
    );
  }

  try {
    let queryParams: Record<string, string>;

    if (geoid) {
      // Clean and validate GEOID (should be 11 digits)
      const cleanGeoid = geoid.replace(/[-\s]/g, '');
      
      // Try both exact match and LIKE query
      queryParams = {
        where: `GEOID='${cleanGeoid}'`,
        outFields: 'GEOID,STATE,COUNTY,TRACT,NAME,ALAND,AWATER',
        returnGeometry: 'true',
        geometryPrecision: '6',
        outSR: '4326', // WGS84 for web mapping
        f: 'geojson',
      };
    } else {
      // Query by point (lat/lng)
      queryParams = {
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'GEOID,STATE,COUNTY,TRACT,NAME,ALAND,AWATER',
        returnGeometry: 'true',
        geometryPrecision: '6',
        outSR: '4326',
        f: 'geojson',
      };
    }

    console.log(`Fetching tract geometry for: ${geoid || `${lat},${lng}`}`);
    
    const data = await fetchFromTigerWeb(queryParams);

    if (!data || !data.features || data.features.length === 0) {
      console.log(`No tract found for ${geoid || `${lat},${lng}`}`);
      return NextResponse.json({
        found: false,
        geoid: geoid || null,
        message: 'No tract geometry found - TIGERweb may be unavailable',
        debug: {
          queriedGeoid: geoid,
          queriedCoords: lat && lng ? [lng, lat] : null,
        }
      });
    }

    const feature = data.features[0];
    const props = feature.properties;

    console.log(`Found tract ${props.GEOID} with geometry type: ${feature.geometry?.type}`);

    return NextResponse.json({
      found: true,
      geoid: props.GEOID,
      state: props.STATE,
      county: props.COUNTY,
      tract: props.TRACT,
      name: props.NAME,
      landArea: props.ALAND,
      waterArea: props.AWATER,
      geometry: feature.geometry,
      // Return as full GeoJSON Feature for direct map use
      feature: {
        type: 'Feature',
        id: props.GEOID,
        properties: {
          geoid: props.GEOID,
          name: `Tract ${props.NAME}`,
          state: props.STATE,
          county: props.COUNTY,
        },
        geometry: feature.geometry,
      },
    });

  } catch (error) {
    console.error('Tract geometry fetch error:', error);
    return NextResponse.json(
      { 
        found: false,
        error: 'Failed to fetch tract geometry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
