/**
 * Tract Geometry API
 * Fetches census tract geometries from Census Bureau TigerWeb
 * 
 * GET /api/geo/tracts?bbox=-90.5,38.5,-89.5,39.5
 * GET /api/geo/tracts?state=29 (Missouri FIPS)
 * GET /api/geo/tracts?geoid=29189010100
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache for tract geometries (in-memory, resets on deploy)
const tractCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const state = searchParams.get('state');
  const geoid = searchParams.get('geoid');
  const limit = parseInt(searchParams.get('limit') || '500');

  try {
    // Option 1: Get by bounding box
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      
      if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
        return NextResponse.json(
          { error: 'Invalid bbox format. Use: minLng,minLat,maxLng,maxLat' },
          { status: 400 }
        );
      }

      const cacheKey = `bbox:${bbox}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      // Query Census Bureau TigerWeb
      const geometry = JSON.stringify({
        xmin: minLng,
        ymin: minLat,
        xmax: maxLng,
        ymax: maxLat,
        spatialReference: { wkid: 4326 }
      });

      const tigerUrl = new URL('https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query');
      tigerUrl.searchParams.set('geometry', geometry);
      tigerUrl.searchParams.set('geometryType', 'esriGeometryEnvelope');
      tigerUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
      tigerUrl.searchParams.set('outFields', 'GEOID,NAME,STATE,COUNTY,TRACT,ALAND,AWATER');
      tigerUrl.searchParams.set('returnGeometry', 'true');
      tigerUrl.searchParams.set('outSR', '4326');
      tigerUrl.searchParams.set('f', 'geojson');
      tigerUrl.searchParams.set('resultRecordCount', String(limit));

      const response = await fetch(tigerUrl.toString(), {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`TigerWeb API error: ${response.status}`);
      }

      const geojson = await response.json();
      
      // Cache the result
      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      
      return NextResponse.json(geojson);
    }

    // Option 2: Get by state FIPS
    if (state) {
      const stateFips = state.padStart(2, '0');
      const cacheKey = `state:${stateFips}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      const tigerUrl = new URL('https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query');
      tigerUrl.searchParams.set('where', `STATE='${stateFips}'`);
      tigerUrl.searchParams.set('outFields', 'GEOID,NAME,STATE,COUNTY,TRACT,ALAND,AWATER');
      tigerUrl.searchParams.set('returnGeometry', 'true');
      tigerUrl.searchParams.set('outSR', '4326');
      tigerUrl.searchParams.set('f', 'geojson');
      tigerUrl.searchParams.set('resultRecordCount', String(limit));

      const response = await fetch(tigerUrl.toString(), {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        throw new Error(`TigerWeb API error: ${response.status}`);
      }

      const geojson = await response.json();
      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      
      return NextResponse.json(geojson);
    }

    // Option 3: Get single tract by GEOID
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, '');
      const cacheKey = `geoid:${cleanGeoid}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      const tigerUrl = new URL('https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query');
      tigerUrl.searchParams.set('where', `GEOID='${cleanGeoid}'`);
      tigerUrl.searchParams.set('outFields', 'GEOID,NAME,STATE,COUNTY,TRACT,ALAND,AWATER');
      tigerUrl.searchParams.set('returnGeometry', 'true');
      tigerUrl.searchParams.set('outSR', '4326');
      tigerUrl.searchParams.set('f', 'geojson');

      const response = await fetch(tigerUrl.toString(), {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        throw new Error(`TigerWeb API error: ${response.status}`);
      }

      const geojson = await response.json();
      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      
      return NextResponse.json(geojson);
    }

    // No valid params
    return NextResponse.json({
      error: 'Missing required parameter',
      usage: {
        bbox: '/api/geo/tracts?bbox=-90.5,38.5,-89.5,39.5',
        state: '/api/geo/tracts?state=29',
        geoid: '/api/geo/tracts?geoid=29189010100'
      }
    }, { status: 400 });

  } catch (error) {
    console.error('[GeoTracts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tract geometries', details: String(error) },
      { status: 500 }
    );
  }
}
