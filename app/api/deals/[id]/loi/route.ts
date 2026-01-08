import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi/loiService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const loiService = getLOIService();

    // Create LOI using existing service
    const loi = await loiService.create(
      {
        deal_id: id,
        cde_id: body.senderOrgId,
        allocation_amount: 0, // Will be fetched from deal
        qlici_rate: 0.5,
        leverage_structure: 'standard',
        term_years: 7,
        special_terms: body.message ? { notes: body.message } : {},
      },
      body.senderOrgId
    );

    return NextResponse.json(
      { success: true, data: loi },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating LOI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create LOI' },
      { status: 500 }
    );
  }
}
