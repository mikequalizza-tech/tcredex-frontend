/**
 * tCredex LOI API
 * 
 * GET /api/loi - List LOIs (filtered by query params)
 * POST /api/loi - Create new LOI
 * 
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { CreateLOIInput, LOIStatus } from '@/types/loi';
import { requireAuth, handleAuthError, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

// =============================================================================
// GET /api/loi
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    const cdeId = searchParams.get('cde_id');
    const sponsorId = searchParams.get('sponsor_id');
    const statusParam = searchParams.get('status');

    const service = getLOIService();
    const status = statusParam?.split(',') as LOIStatus[] | undefined;

    let lois;

    if (dealId) {
      // CRITICAL: Verify user can access this deal
      await verifyDealAccess(request, user, dealId, 'view');
      lois = await service.getByDeal(dealId);
    } else if (cdeId) {
      // CRITICAL: Verify user's org is the CDE or user is admin
      if (user.organizationType === 'cde' && user.organizationId !== cdeId) {
        return NextResponse.json(
          { success: false, error: 'You can only view LOIs for your organization' },
          { status: 403 }
        );
      }
      lois = await service.getByCDE(cdeId, status);
    } else if (sponsorId) {
      // CRITICAL: Verify user's org is the sponsor or user is admin
      if (user.organizationType === 'sponsor' && user.organizationId !== sponsorId) {
        return NextResponse.json(
          { success: false, error: 'You can only view LOIs for your organization' },
          { status: 403 }
        );
      }
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
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/loi
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
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

    // CRITICAL: Verify user's org is the CDE issuing the LOI
    if (user.organizationType === 'cde' && user.organizationId !== input.cde_id) {
      return NextResponse.json(
        { success: false, error: 'You can only issue LOIs for your organization' },
        { status: 403 }
      );
    }

    // CRITICAL: Verify user can access the deal
    await verifyDealAccess(request, user, input.deal_id, 'view');

    const service = getLOIService();
    const loi = await service.create(input, issued_by);

    return NextResponse.json({
      success: true,
      loi,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
