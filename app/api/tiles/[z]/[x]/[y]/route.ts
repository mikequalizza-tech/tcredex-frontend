/**
 * Vector Tile API - Fast Full-US Tract Rendering
 * ===============================================
 * Uses PostGIS ST_AsMVT to generate Mapbox Vector Tiles (MVT)
 *
 * This endpoint serves vector tiles for the map at low zoom levels,
 * allowing instant rendering of 85,000+ census tracts nationwide.
 *
 * At higher zoom levels or after address search, the frontend
 * switches to GeoJSON polygons from /api/map/tracts for detailed data.
 *
 * Properties returned per tract:
 *   - geoid: Census tract GEOID (11 digits)
 *   - e: Eligible (1 = has any tax credit, 0 = not eligible)
 *   - s: Stack score (number of overlapping programs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zStr, x: xStr, y: yStr } = await params;
  const z = parseInt(zStr);
  const x = parseInt(xStr);
  const y = parseInt(yStr);

  // Validate tile coordinates
  if (isNaN(z) || isNaN(x) || isNaN(y) || z < 0 || z > 20) {
    return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }

  try {
    // Try optimized RPC function first (uses pre-simplified geometries)
    let result;
    try {
      const { data, error } = await supabase.rpc('get_vector_tile', {
        z_param: z,
        x_param: x,
        y_param: y,
      });

      if (error) throw error;
      result = data;
    } catch (rpcError) {
      // Fallback to inline query if RPC doesn't exist
      console.log('[Tiles] RPC not available, using inline query');
      const simplifyFactor = z < 6 ? 0.01 : (z < 10 ? 0.001 : 0.0001);

      // Eligibility = Federal programs only (State programs are bonuses)
      // NMTC (LIC or High Migration), LIHTC QCT, OZ
      // NOTE: DDA is NOT a standalone qualifier - only a 30% boost if LIHTC QCT eligible
      const { data, error } = await supabase.rpc('get_vector_tile_inline', {
        z_param: z,
        x_param: x,
        y_param: y,
        simplify_factor: simplifyFactor,
      });

      if (error) throw error;
      result = data;
    }

    const mvt = result;

    if (!mvt || mvt.length === 0) {
      // Return empty tile (HTTP 204)
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Cache-Control': 'public, max-age=86400', // Cache 24 hours
        },
      });
    }

    return new NextResponse(mvt, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Content-Encoding': 'identity',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: unknown) {
    // Return empty tile on timeout or error (graceful degradation)
    const pgError = error as { code?: string };
    if (pgError.code === '57014') {
      // Statement timeout - return empty tile silently
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Cache-Control': 'public, max-age=300', // Short cache on timeout
        },
      });
    }
    console.error('[Tiles] Error generating tile:', error);
    return NextResponse.json({ error: 'Tile generation failed' }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
