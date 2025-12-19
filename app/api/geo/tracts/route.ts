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

// TigerWeb ACS 2021 - Layer 8 = Tracts
const TIGERWEB_TRACTS_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const state = searchParams.get('state');
  const geoid = searchParams.get('geoid');
  const limit = parseInt(searchParams.get('limit') || '200');

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

      // Use URL-encoded envelope format that ArcGIS expects
      const params = new URLSearchParams({
        geometry: `${minLng},${minLat},${maxLng},${maxLat}`,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'GEOID,NAME,STATE,COUNTY,TRACT',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson',
        resultRecordCount: String(limit)
      });

      const fullUrl = `${TIGERWEB_TRACTS_URL}?${params.toString()}`;
      console.log('[GeoTracts] Fetching:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: { 
          'Accept': 'application/json',
        },
      });

      const text = await response.text();
      let geojson;
      
      try {
        geojson = JSON.parse(text);
      } catch {
        console.error('[GeoTracts] Failed to parse:', text.substring(0, 500));
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }

      // Check for API error
      if (geojson.error) {
        console.error('[GeoTracts] TigerWeb error:', geojson.error);
        return NextResponse.json({ 
          type: 'FeatureCollection', 
          features: [],
          _error: geojson.error 
        });
      }
      
      // Validate GeoJSON structure
      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        console.warn('[GeoTracts] Invalid response');
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }
      
      // Filter invalid geometries
      geojson.features = geojson.features.filter((f: { geometry?: { type?: string; coordinates?: unknown } }) => 
        f && f.geometry && f.geometry.type && f.geometry.coordinates
      );

      console.log('[GeoTracts] Returned', geojson.features.length, 'tracts');
      
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

      const params = new URLSearchParams({
        where: `STATE='${stateFips}'`,
        outFields: 'GEOID,NAME,STATE,COUNTY,TRACT',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson',
        resultRecordCount: String(limit)
      });

      const response = await fetch(`${TIGERWEB_TRACTS_URL}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
      });

      const geojson = await response.json();
      
      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }
      
      geojson.features = geojson.features.filter((f: { geometry?: { type?: string; coordinates?: unknown } }) => 
        f && f.geometry && f.geometry.type && f.geometry.coordinates
      );
      
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

      const params = new URLSearchParams({
        where: `GEOID='${cleanGeoid}'`,
        outFields: 'GEOID,NAME,STATE,COUNTY,TRACT',
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson'
      });

      const response = await fetch(`${TIGERWEB_TRACTS_URL}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
      });

      const geojsonResult = await response.json();
      
      if (!geojsonResult || geojsonResult.type !== 'FeatureCollection' || !Array.isArray(geojsonResult.features)) {
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }
      
      geojsonResult.features = geojsonResult.features.filter((f: { geometry?: { type?: string; coordinates?: unknown } }) => 
        f && f.geometry && f.geometry.type && f.geometry.coordinates
      );
      
      tractCache.set(cacheKey, { data: geojsonResult, timestamp: Date.now() });
      
      return NextResponse.json(geojsonResult);
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
