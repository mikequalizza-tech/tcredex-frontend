/**
 * tCredex Admin API - Deals Management
 * GET /api/admin/deals - List all deals with filters
 * POST /api/admin/deals/bulk - Bulk actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DealStatus } from '@/lib/deals';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DealStatus | null;
    const program = searchParams.get('program');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
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
        created_at,
        updated_at,
        profiles!deals_user_id_fkey(email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (program) {
      query = query.eq('program_type', program);
    }
    if (search) {
      query = query.or(`project_name.ilike.%${search}%,sponsor_name.ilike.%${search}%`);
    }

    const { data: deals, count, error } = await query;

    if (error) {
      console.error('Admin deals query error:', error);
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    // Format response
    const formatted = (deals || []).map(deal => ({
      id: deal.id,
      projectName: deal.project_name,
      sponsorName: deal.sponsor_name,
      sponsorEmail: (deal.profiles as { email?: string })?.email,
      programType: deal.program_type,
      status: deal.status,
      allocation: deal.allocation_amount || 0,
      location: deal.city && deal.state ? `${deal.city}, ${deal.state}` : null,
      censusTract: deal.census_tract,
      createdAt: deal.created_at,
      updatedAt: deal.updated_at,
    }));

    return NextResponse.json({
      deals: formatted,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
