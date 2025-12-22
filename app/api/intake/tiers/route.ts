/**
 * tCredex Intake Tiers API
 * 
 * GET /api/intake/tiers?deal_id=xxx - Get deal tier status
 * POST /api/intake/tiers - Advance tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntakeTierService } from '@/lib/intake';
import { IntakeTier } from '@/types/intakeTiers';

// =============================================================================
// GET /api/intake/tiers - Get deal tier status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: 'deal_id required' },
        { status: 400 }
      );
    }

    const service = getIntakeTierService();
    const status = await service.getDealTierStatus(dealId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Tier status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/intake/tiers - Advance tier
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_id, target_tier, user_id } = body as {
      deal_id: string;
      target_tier: IntakeTier;
      user_id: string;
    };

    if (!deal_id || !target_tier || !user_id) {
      return NextResponse.json(
        { success: false, error: 'deal_id, target_tier, and user_id required' },
        { status: 400 }
      );
    }

    if (![1, 2, 3, 4].includes(target_tier)) {
      return NextResponse.json(
        { success: false, error: 'target_tier must be 1, 2, 3, or 4' },
        { status: 400 }
      );
    }

    const service = getIntakeTierService();
    const result = await service.advanceTier(deal_id, target_tier, user_id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tier advance error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
