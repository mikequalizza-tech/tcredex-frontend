/**
 * tCredex LOI Actions API
 * 
 * POST /api/loi/[id]/actions
 * 
 * Actions:
 * - issue: CDE issues draft LOI
 * - send: CDE sends to sponsor
 * - respond: Sponsor accepts/rejects/counters
 * - withdraw: CDE withdraws LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { LOISponsorResponse } from '@/types/loi';

type LOIAction = 'issue' | 'send' | 'respond' | 'withdraw';

interface ActionRequest {
  action: LOIAction;
  user_id: string;
  // For respond action
  response?: LOISponsorResponse;
  // For withdraw action
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as ActionRequest;
    const { action, user_id } = body;

    if (!action || !user_id) {
      return NextResponse.json(
        { success: false, error: 'action and user_id required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    let loi;

    switch (action) {
      case 'issue':
        loi = await service.issue(id, user_id);
        break;

      case 'send':
        loi = await service.sendToSponsor(id, user_id);
        break;

      case 'respond':
        if (!body.response) {
          return NextResponse.json(
            { success: false, error: 'response object required for respond action' },
            { status: 400 }
          );
        }
        loi = await service.sponsorRespond(id, body.response, user_id);
        break;

      case 'withdraw':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for withdraw action' },
            { status: 400 }
          );
        }
        loi = await service.withdraw(id, user_id, body.reason);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      loi,
      action_performed: action,
    });
  } catch (error) {
    console.error('LOI action error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
