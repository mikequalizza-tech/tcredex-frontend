/**
 * tCredex LOI API - Individual Operations
 * 
 * GET /api/loi/[id] - Get LOI by ID
 * PUT /api/loi/[id] - Update LOI
 * DELETE /api/loi/[id] - Withdraw LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { UpdateLOIInput } from '@/types/loi';

// =============================================================================
// GET /api/loi/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getLOIService();
    const loi = await service.getById(id);

    if (!loi) {
      return NextResponse.json(
        { success: false, error: 'LOI not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      loi,
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
// PUT /api/loi/[id]
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { input, user_id } = body as { input: UpdateLOIInput; user_id: string };

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    const loi = await service.update(id, input, user_id);

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    console.error('LOI PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/loi/[id] (Withdraw)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, reason } = body as { user_id: string; reason: string };

    if (!user_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'user_id and reason required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    const loi = await service.withdraw(id, user_id, reason);

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    console.error('LOI DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
