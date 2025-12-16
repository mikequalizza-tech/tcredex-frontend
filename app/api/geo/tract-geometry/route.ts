import { NextRequest, NextResponse } from 'next/server';

// Census TIGERweb ACS 2021 Tracts layer
const TIGERWEB_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query';

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
      // Query by GEOID
      const cleanGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');
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

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await fetch(`${TIGERWEB_URL}?${queryString}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`TIGERweb API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({
        found: false,
        geoid: geoid || null,
        message: 'No tract found for this location',
      });
    }

    const feature = data.features[0];
    const props = feature.properties;

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
        error: 'Failed to fetch tract geometry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
