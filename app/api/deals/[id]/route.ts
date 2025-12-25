/**
 * tCredex Deal API - Single Deal Operations
 * GET, PATCH, DELETE for individual deals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/deals/[id] - Get single deal
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        sponsor:sponsors(id, organization_id, organization_type),
        assigned_cde:cdes(id, organization_id, mission_statement),
        documents:documents(id, name, category, status, created_at)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/deals/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

// =============================================================================
// PATCH /api/deals/[id] - Update deal
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { id: _, created_at, ...updates } = body;

    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw error;
    }

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: body.updated_by || 'unknown',
      entity_type: 'application',
      entity_id: id,
      action: 'application_updated',
      payload_json: { updated_fields: Object.keys(updates) },
      hash: generateHash({ id, updates }),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/deals/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/deals/[id] - Delete deal (soft delete via status)
// =============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Soft delete - change status to withdrawn
    const { data, error } = await supabase
      .from('deals')
      .update({ status: 'withdrawn', visible: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw error;
    }

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: 'unknown',
      entity_type: 'application',
      entity_id: id,
      action: 'application_status_changed',
      payload_json: { new_status: 'withdrawn' },
      hash: generateHash({ id, action: 'withdrawn' }),
    });

    return NextResponse.json({ success: true, message: 'Deal withdrawn' });
  } catch (error) {
    console.error('DELETE /api/deals/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}

function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
