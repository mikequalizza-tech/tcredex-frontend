/**
 * tCredex API - Deals
 * GET /api/deals - List all deals
 * POST /api/deals - Create new deal (from intake)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const program = searchParams.get('program');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('deals')
      .select(`
        id,
        project_name,
        sponsor_name,
        program_type,
        status,
        allocation_amount,
        city,
        state,
        census_tract,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (program && program !== 'all') {
      query = query.eq('program_type', program);
    }

    // Only show available deals to non-owners (public marketplace)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      query = query.eq('status', 'available');
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Deals query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Transform to mobile-friendly format
    const formatted = (deals || []).map(deal => ({
      id: deal.id,
      projectName: deal.project_name,
      sponsorName: deal.sponsor_name,
      programType: deal.program_type,
      status: deal.status,
      allocation: deal.allocation_amount || 0,
      city: deal.city,
      state: deal.state,
      censusTract: deal.census_tract,
      submittedDate: deal.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        ...body,
        user_id: user.id,
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Deal creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create deal' },
        { status: 500 }
      );
    }

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Deal creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
