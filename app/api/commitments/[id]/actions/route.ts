/**
 * tCredex Commitment Actions API
 * 
 * POST /api/commitments/[id]/actions
 * 
 * Actions:
 * - issue: Investor issues draft commitment
 * - send: Investor sends for acceptance
 * - sponsor_accept: Sponsor accepts commitment
 * - cde_accept: CDE accepts commitment (NMTC only)
 * - reject: Any party rejects
 * - withdraw: Investor withdraws commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi';

type CommitmentAction = 
  | 'issue' 
  | 'send' 
  | 'sponsor_accept' 
  | 'cde_accept' 
  | 'reject' 
  | 'withdraw';

interface ActionRequest {
  action: CommitmentAction;
  user_id: string;
  notes?: string;
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as ActionRequest;
    const { action, user_id, notes, reason } = body;

    if (!action || !user_id) {
      return NextResponse.json(
        { success: false, error: 'action and user_id required' },
        { status: 400 }
      );
    }

    const service = getCommitmentService();
    let commitment;

    switch (action) {
      case 'issue':
        commitment = await service.issue(id, user_id);
        break;

      case 'send':
        commitment = await service.sendForAcceptance(id, user_id);
        break;

      case 'sponsor_accept':
        commitment = await service.sponsorAccept(id, user_id, notes);
        break;

      case 'cde_accept':
        commitment = await service.cdeAccept(id, user_id, notes);
        break;

      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for reject action' },
            { status: 400 }
          );
        }
        commitment = await service.reject(id, user_id, reason);
        break;

      case 'withdraw':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for withdraw action' },
            { status: 400 }
          );
        }
        commitment = await service.withdraw(id, user_id, reason);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Check if closing room was triggered
    const closingTriggered = commitment.status === 'all_accepted';

    return NextResponse.json({
      success: true,
      commitment,
      action_performed: action,
      closing_room_triggered: closingTriggered,
    });
  } catch (error) {
    console.error('Commitment action error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
