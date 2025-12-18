/**
 * tCredex Admin API - Single Deal Management
 * GET /api/admin/deals/[id] - Get deal details
 * PATCH /api/admin/deals/[id] - Update deal (status transition)
 * DELETE /api/admin/deals/[id] - Delete deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { transitionDeal, DealStatus } from '@/lib/deals';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Verify admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: deal, error } = await supabaseAdmin
      .from('deals')
      .select(`
        *,
        profiles!deals_user_id_fkey(id, email, full_name, phone),
        deal_parties(*),
        deal_documents(*),
        deal_timeline(*)
      `)
      .eq('id', id)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Admin deal detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Verify admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, note } = body;

    if (action) {
      const statusMap: Record<string, DealStatus> = {
        approve: 'approved',
        decline: 'declined',
        request_info: 'needs_info',
        start_review: 'under_review',
        make_available: 'available',
        mark_funded: 'funded',
      };

      const newStatus = statusMap[action];
      if (!newStatus) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      const result = await transitionDeal(id, newStatus, user.id, 'admin', note);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        newStatus: result.newStatus,
        message: `Deal ${action}d successfully`,
      });
    }

    const allowedFields = [
      'project_name',
      'sponsor_name',
      'program_type',
      'allocation_amount',
      'admin_notes',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabaseAdmin
        .from('deals')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin deal update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Verify admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      const { error } = await supabaseAdmin
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from('deals')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Failed to withdraw deal' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Admin deal delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
