/**
 * tCredex Commitment API - Individual Operations
 * 
 * GET /api/commitments/[id] - Get commitment by ID
 * PUT /api/commitments/[id] - Update commitment
 * DELETE /api/commitments/[id] - Withdraw commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi';
import { UpdateCommitmentInput } from '@/types/loi';

// =============================================================================
// GET /api/commitments/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getCommitmentService();
    const commitment = await service.getById(id);

    if (!commitment) {
      return NextResponse.json(
        { success: false, error: 'Commitment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    console.error('Commitment GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/commitments/[id]
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { input, user_id } = body as { input: UpdateCommitmentInput; user_id: string };

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id required' },
        { status: 400 }
      );
    }

    const service = getCommitmentService();
    const commitment = await service.update(id, input, user_id);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    console.error('Commitment PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/commitments/[id] (Withdraw)
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

    const service = getCommitmentService();
    const commitment = await service.withdraw(id, user_id, reason);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    console.error('Commitment DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
