import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi/commitmentService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const commitmentService = getCommitmentService();

    // Create commitment using existing service
    const commitment = await commitmentService.create(
      {
        deal_id: id,
        investor_id: body.senderOrgId,
        investment_amount: 0, // Will be fetched from deal
        credit_type: 'NMTC',
        credit_rate: 0.5,
        special_terms: body.message ? { notes: body.message } : {},
      },
      body.senderOrgId
    );

    return NextResponse.json(
      { success: true, data: commitment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating commitment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create commitment' },
      { status: 500 }
    );
  }
}
