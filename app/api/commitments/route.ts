/**
 * tCredex Commitment API
 * 
 * GET /api/commitments - List commitments (filtered by query params)
 * POST /api/commitments - Create new commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi';
import { CreateCommitmentInput, CommitmentStatus } from '@/types/loi';

// =============================================================================
// GET /api/commitments
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    const investorId = searchParams.get('investor_id');
    const cdeId = searchParams.get('cde_id');
    const sponsorId = searchParams.get('sponsor_id');
    const statusParam = searchParams.get('status');

    const service = getCommitmentService();
    const status = statusParam?.split(',') as CommitmentStatus[] | undefined;

    let commitments;

    if (dealId) {
      commitments = await service.getByDeal(dealId);
    } else if (investorId) {
      commitments = await service.getByInvestor(investorId, status);
    } else if (cdeId) {
      commitments = await service.getByCDE(cdeId, status);
    } else if (sponsorId) {
      commitments = await service.getBySponsor(sponsorId, status);
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide deal_id, investor_id, cde_id, or sponsor_id' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      commitments,
      total: commitments.length,
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
// POST /api/commitments
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, issued_by } = body as { input: CreateCommitmentInput; issued_by: string };

    if (!input || !issued_by) {
      return NextResponse.json(
        { success: false, error: 'input and issued_by required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!input.deal_id || !input.investor_id || !input.investment_amount || !input.credit_type) {
      return NextResponse.json(
        { success: false, error: 'deal_id, investor_id, investment_amount, and credit_type required' },
        { status: 400 }
      );
    }

    const service = getCommitmentService();
    const commitment = await service.create(input, issued_by);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    console.error('Commitment POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
