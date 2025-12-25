/**
 * tCredex API - My Deals
 * GET /api/deals/mine - Get current user's deals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy init to avoid build-time env issues
let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    // For now, return demo data since auth isn't fully wired
    // TODO: Wire up proper auth
    const { data: deals, error } = await supabase
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
      .limit(10);

    if (error) {
      console.error('My deals query error:', error);
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
    console.error('My deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
