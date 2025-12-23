/**
 * tCredex CDE API - Single CDE Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/cdes/[id] - Get single CDE with allocations
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('cdes')
      .select(`
        *,
        organization:organizations(name, slug, website, city, state, logo_url),
        allocations:cde_allocations(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/cdes/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch CDE' }, { status: 500 });
  }
}

// =============================================================================
// PATCH /api/cdes/[id] - Update CDE profile
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Handle allocations separately
    const { allocations, ...cdeUpdates } = body;

    // Update CDE profile
    const { data, error } = await supabase
      .from('cdes')
      .update(cdeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
      }
      throw error;
    }

    // Update allocations if provided
    if (allocations && Array.isArray(allocations)) {
      // Delete existing allocations
      await supabase.from('cde_allocations').delete().eq('cde_id', id);

      // Insert new allocations
      if (allocations.length > 0) {
        const allocationsToInsert = allocations.map((a: Record<string, unknown>) => ({
          cde_id: id,
          type: a.type,
          year: a.year,
          state_code: a.state_code,
          awarded_amount: a.awarded_amount,
          available_on_platform: a.available_on_platform,
          deployment_deadline: a.deployment_deadline,
        }));

        await supabase.from('cde_allocations').insert(allocationsToInsert);
      }

      // Recalculate totals
      const totalAllocation = allocations.reduce((sum: number, a: Record<string, number>) => sum + (a.awarded_amount || 0), 0);
      const remainingAllocation = allocations.reduce((sum: number, a: Record<string, number>) => sum + (a.available_on_platform || 0), 0);

      await supabase
        .from('cdes')
        .update({ total_allocation: totalAllocation, remaining_allocation: remainingAllocation })
        .eq('id', id);
    }

    // Fetch updated CDE with allocations
    const { data: updated } = await supabase
      .from('cdes')
      .select(`*, allocations:cde_allocations(*)`)
      .eq('id', id)
      .single();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/cdes/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update CDE' }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/cdes/[id] - Deactivate CDE
// =============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('cdes')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cdes/[id] error:', error);
    return NextResponse.json({ error: 'Failed to deactivate CDE' }, { status: 500 });
  }
}
