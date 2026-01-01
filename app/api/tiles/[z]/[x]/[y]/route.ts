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
import { Pool } from 'pg';

// Connection pool - reused across requests for efficiency
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

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
    const client = await pool.connect();

    try {
      // Try optimized RPC function first (uses pre-simplified geometries)
      let result;
      try {
        result = await client.query(
          'SELECT get_vector_tile($1, $2, $3) as mvt',
          [z, x, y]
        );
      } catch (rpcError) {
        // Fallback to inline query if RPC doesn't exist
        console.log('[Tiles] RPC not available, using inline query');
        const simplifyFactor = z < 6 ? 0.01 : (z < 10 ? 0.001 : 0.0001);

        // Eligibility = Federal programs only (State programs are bonuses)
        // NMTC (LIC or High Migration), LIHTC QCT, OZ
        // NOTE: DDA is NOT a standalone qualifier - only a 30% boost if LIHTC QCT eligible
        result = await client.query(`
          WITH bounds AS (
            SELECT ST_Transform(ST_TileEnvelope($1, $2, $3), 4326) as geom_bounds,
                   ST_TileEnvelope($1, $2, $3) as mvt_bounds
          )
          SELECT ST_AsMVT(tile, 'tracts', 4096, 'geom') as mvt
          FROM (
            SELECT
              g.geoid,
              CASE WHEN (
                COALESCE(s.is_nmtc_eligible, false) OR
                COALESCE(s.is_nmtc_high_migration, false) OR
                COALESCE(s.is_lihtc_qct_2025, false) OR
                COALESCE(s.is_lihtc_qct_2026, false) OR
                COALESCE(s.is_oz_designated, false)
              ) THEN 1 ELSE 0 END as e,
              COALESCE(s.stack_score, 0) as s,
              ST_AsMVTGeom(
                ST_Transform(
                  COALESCE(g.geometry_simplified, ST_Simplify(g.geometry, $4)),
                  3857
                ),
                (SELECT mvt_bounds FROM bounds),
                4096, 64, true
              ) as geom
            FROM tract_geometries g
            LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
            WHERE g.geometry && (SELECT geom_bounds FROM bounds)
          ) as tile
          WHERE geom IS NOT NULL
        `, [z, x, y, simplifyFactor]);
      }

      const mvt = result.rows[0]?.mvt;

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
    } finally {
      client.release();
    }
  } catch (error) {
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
