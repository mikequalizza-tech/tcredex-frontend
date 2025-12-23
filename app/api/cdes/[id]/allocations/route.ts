/**
 * tCredex CDE Allocations API
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
// GET /api/cdes/[id]/allocations
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('cde_allocations')
      .select('*')
      .eq('cde_id', id)
      .order('year', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('GET /api/cdes/[id]/allocations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/cdes/[id]/allocations - Add new allocation
// =============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.year || !body.awarded_amount) {
      return NextResponse.json(
        { error: 'type, year, and awarded_amount are required' },
        { status: 400 }
      );
    }
    
    const allocationData = {
      cde_id: id,
      type: body.type,
      year: body.year,
      state_code: body.state_code,
      awarded_amount: body.awarded_amount,
      available_on_platform: body.available_on_platform || body.awarded_amount,
      deployed_amount: body.deployed_amount || 0,
      percentage_won: body.percentage_won,
      deployment_deadline: body.deployment_deadline,
      notes: body.notes,
    };
    
    const { data, error } = await supabase
      .from('cde_allocations')
      .insert(allocationData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update CDE totals
    await updateCDETotals(id);
    
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/cdes/[id]/allocations error:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper: Update CDE allocation totals
// =============================================================================

async function updateCDETotals(cdeId: string) {
  const { data: allocations } = await supabase
    .from('cde_allocations')
    .select('awarded_amount, available_on_platform, deployment_deadline')
    .eq('cde_id', cdeId);
  
  if (!allocations || allocations.length === 0) return;
  
  const totalAllocation = allocations.reduce((sum, a) => sum + (a.awarded_amount || 0), 0);
  const remainingAllocation = allocations.reduce((sum, a) => sum + (a.available_on_platform || 0), 0);
  
  // Find earliest deadline
  const deadlines = allocations
    .filter(a => a.deployment_deadline)
    .map(a => new Date(a.deployment_deadline!));
  const earliestDeadline = deadlines.length > 0 
    ? new Date(Math.min(...deadlines.map(d => d.getTime()))).toISOString().split('T')[0]
    : null;
  
  await supabase
    .from('cdes')
    .update({
      total_allocation: totalAllocation,
      remaining_allocation: remainingAllocation,
      deployment_deadline: earliestDeadline,
    })
    .eq('id', cdeId);
}
