/**
 * Tract Data API for Section C Scoring Engine
 * ============================================
 * Fetches tract data from nmtc_ct_data_2025 (SOT)
 * for use in scoring calculations.
 *
 * GET /api/scoring/tract?geoid=01001020100
 * GET /api/scoring/tract?lat=38.846&lng=-76.9275
 *
 * Source of Truth: nmtc_ct_data_2025 (CDFI Fund 2025 data)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTractDataForScoring,
  getTractDataAtPoint,
  buildScoringInputTract,
} from '@/lib/scoring/tractLookup';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const geoid = searchParams.get('geoid');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // GEOID direct lookup
    if (geoid) {
      const normalizedGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');
      const tractData = await getTractDataForScoring(normalizedGeoid);

      if (!tractData) {
        return NextResponse.json(
          {
            success: false,
            error: `Tract ${normalizedGeoid} not found in nmtc_ct_data_2025`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        tract: tractData,
        scoring_input_tract: buildScoringInputTract(tractData),
        source: 'nmtc_ct_data_2025',
      });
    }

    // Coordinate lookup (point-in-polygon)
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { success: false, error: 'Invalid coordinates' },
          { status: 400 }
        );
      }

      const tractData = await getTractDataAtPoint(latitude, longitude);

      if (!tractData) {
        return NextResponse.json(
          {
            success: false,
            error: 'No tract found at coordinates',
            coordinates: [longitude, latitude],
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        tract: tractData,
        scoring_input_tract: buildScoringInputTract(tractData),
        coordinates: [longitude, latitude],
        source: 'nmtc_ct_data_2025',
      });
    }

    // No valid parameters
    return NextResponse.json(
      {
        success: false,
        error: 'Provide geoid or lat/lng parameters',
        usage: {
          by_geoid: '/api/scoring/tract?geoid=01001020100',
          by_coords: '/api/scoring/tract?lat=38.846&lng=-76.9275',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Scoring Tract API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
