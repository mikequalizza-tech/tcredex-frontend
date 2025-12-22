/**
 * tCredex LOI API
 * 
 * GET /api/loi - List LOIs (filtered by query params)
 * POST /api/loi - Create new LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { CreateLOIInput, LOIStatus } from '@/types/loi';

// =============================================================================
// GET /api/loi
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    const cdeId = searchParams.get('cde_id');
    const sponsorId = searchParams.get('sponsor_id');
    const statusParam = searchParams.get('status');

    const service = getLOIService();
    const status = statusParam?.split(',') as LOIStatus[] | undefined;

    let lois;

    if (dealId) {
      lois = await service.getByDeal(dealId);
    } else if (cdeId) {
      lois = await service.getByCDE(cdeId, status);
    } else if (sponsorId) {
      lois = await service.getBySponsor(sponsorId, status);
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide deal_id, cde_id, or sponsor_id' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      lois,
      total: lois.length,
    });
  } catch (error) {
    console.error('LOI GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/loi
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, issued_by } = body as { input: CreateLOIInput; issued_by: string };

    if (!input || !issued_by) {
      return NextResponse.json(
        { success: false, error: 'input and issued_by required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!input.deal_id || !input.cde_id || !input.allocation_amount) {
      return NextResponse.json(
        { success: false, error: 'deal_id, cde_id, and allocation_amount required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    const loi = await service.create(input, issued_by);

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    console.error('LOI POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
