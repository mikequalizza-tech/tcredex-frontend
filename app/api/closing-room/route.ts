import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabase = getSupabaseAdmin();

interface ClosingRoomSummaryRow {
  id: string;
  deal_id: string;
  project_name: string;
  status: string;
  target_close_date: string | null;
  checklist_pct: number;
  has_open_issues: boolean;
  issue_count: number;
  allocation_amount: number;
  investment_amount: number;
  credit_type: string;
  opened_at: string | null;
  days_to_close: number | null;
  participant_count: number;
}

export interface ClosingRoomListItem {
  id: string;
  deal_id: string;
  project_name: string;
  sponsor_name: string;
  program_type: string;
  status: string;
  allocation_amount: number;
  investment_amount: number;
  credit_price: number;
  checklist_pct: number;
  target_close_date: string | null;
  opened_at: string | null;
  has_open_issues: boolean;
  issue_count: number;
  participant_count: number;
  days_to_close: number | null;
}

// GET /api/closing-room - List all closing rooms for user
// GET /api/closing-room?status=active - Filter by status
// GET /api/closing-room?dealId=xxx - Get specific closing room by deal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dealId = searchParams.get('dealId');
    const userId = searchParams.get('userId');

    // If specific deal requested
    if (dealId) {
      const { data, error } = await supabase
        .from('closing_rooms')
        .select(`
          *,
          deals (
            id,
            project_name,
            program_type,
            total_project_cost,
            allocation_request,
            credit_type,
            organizations (name)
          ),
          closing_room_participants (
            id,
            user_id,
            role,
            organization_name,
            permissions
          ),
          closing_room_milestones (
            id,
            milestone_name,
            target_date,
            completed_at,
            sort_order
          ),
          closing_room_issues (
            id,
            title,
            priority,
            status,
            assigned_to
          )
        `)
        .eq('deal_id', dealId)
        .single();

      if (error) {
        console.error('Closing room fetch error:', error);
        return NextResponse.json({ error: 'Closing room not found' }, { status: 404 });
      }

      return NextResponse.json({ closingRoom: data });
    }

    // List closing rooms - query actual table instead of non-existent view
    const { data, error } = await supabase
      .from('closing_rooms')
      .select(`
        id,
        deal_id,
        status,
        target_close_date,
        opened_at,
        created_at,
        allocation_amount,
        investment_amount,
        deals (
          id,
          project_name,
          sponsor_name,
          program_type,
          nmtc_financing_requested,
          total_project_cost
        )
      `) as any;

    if (error) {
      console.error('Closing rooms fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch closing rooms' }, { status: 500 });
    }

    const typedData = (data || []) as Array<{
      id: string;
      deal_id: string;
      status: string;
      target_close_date: string | null;
      opened_at: string | null;
      created_at: string;
      allocation_amount: number;
      investment_amount: number;
    }>;

    // Calculate stats
    const stats = {
      total: typedData?.length || 0,
      active: typedData?.filter(r => r.status === 'active').length || 0,
      pending: typedData?.filter(r => r.status === 'pending').length || 0,
      closing: typedData?.filter(r => r.status === 'closing').length || 0,
      onHold: typedData?.filter(r => r.status === 'on_hold').length || 0,
      totalAllocation: typedData?.reduce((sum, r) => sum + (r.allocation_amount || 0), 0) || 0,
      totalInvestment: typedData?.reduce((sum, r) => sum + (r.investment_amount || 0), 0) || 0,
    };

    return NextResponse.json({
      closingRooms: typedData || [],
      stats,
    });

  } catch (error) {
    console.error('Closing room API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/closing-room - Create closing room for a deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealId,
      commitmentId,
      loiId,
      sponsorId,
      cdeId,
      investorId,
      targetCloseDate,
      allocationAmount,
      investmentAmount,
      creditType,
      createdBy,
    } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }

    // Check if closing room already exists for this deal
    const { data: existingData } = await supabase
      .from('closing_rooms')
      .select('id')
      .eq('deal_id', dealId)
      .single();

    const existing = existingData as { id: string } | null;

    if (existing) {
      return NextResponse.json({
        error: 'Closing room already exists for this deal',
        closingRoomId: existing.id
      }, { status: 409 });
    }

    // Get deal info to populate defaults
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, project_name, program_type, allocation_request, user_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Create closing room
    const insertData = {
      deal_id: dealId,
      commitment_id: commitmentId,
      loi_id: loiId,
      sponsor_id: sponsorId || (deal as { user_id: string }).user_id,
      cde_id: cdeId,
      investor_id: investorId,
      status: 'pending',
      opened_at: new Date().toISOString(),
      target_close_date: targetCloseDate,
      allocation_amount: allocationAmount || (deal as { allocation_request: number }).allocation_request,
      investment_amount: investmentAmount,
      credit_type: creditType || (deal as { program_type: string }).program_type,
      created_by: createdBy,
    };

    const { data: closingRoom, error: createError } = await supabase
      .from('closing_rooms')
      .insert(insertData as never)
      .select()
      .single();

    if (createError) {
      console.error('Closing room create error:', createError);
      return NextResponse.json({ error: 'Failed to create closing room' }, { status: 500 });
    }

    // Initialize checklist for this deal
    const checklistResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/closing-room/checklist`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      }
    );

    const checklistResult = await checklistResponse.json();

    // Add sponsor as first participant
    const dealData = deal as { user_id: string };
    const roomData = closingRoom as { id: string };
    if (sponsorId || dealData.user_id) {
      await supabase.from('closing_room_participants').insert({
        closing_room_id: roomData.id,
        user_id: sponsorId || dealData.user_id,
        role: 'sponsor',
        permissions: { view: true, upload: true, approve: false },
        accepted_at: new Date().toISOString(),
      } as never);
    }

    // Log activity
    await supabase.from('closing_room_activity').insert({
      closing_room_id: roomData.id,
      user_id: createdBy,
      activity_type: 'room_created',
      description: 'Closing room created',
      metadata: { deal_id: dealId, checklist_items: checklistResult.itemsCreated },
    } as never);

    return NextResponse.json({
      success: true,
      closingRoom,
      checklistItemsCreated: checklistResult.itemsCreated || 0,
    });

  } catch (error) {
    console.error('Closing room POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/closing-room - Update closing room
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { closingRoomId, status, targetCloseDate, notes, actualCloseDate, terminationReason } = body;

    if (!closingRoomId) {
      return NextResponse.json({ error: 'closingRoomId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.actual_close_date = actualCloseDate || new Date().toISOString().split('T')[0];
      }
      if (status === 'terminated') {
        updateData.terminated_at = new Date().toISOString();
        updateData.termination_reason = terminationReason;
      }
    }
    if (targetCloseDate !== undefined) updateData.target_close_date = targetCloseDate;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('closing_rooms')
      .update(updateData as never)
      .eq('id', closingRoomId)
      .select()
      .single();

    if (error) {
      console.error('Closing room update error:', error);
      return NextResponse.json({ error: 'Failed to update closing room' }, { status: 500 });
    }

    return NextResponse.json({ success: true, closingRoom: data });

  } catch (error) {
    console.error('Closing room PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
