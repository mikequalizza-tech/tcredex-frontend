/**
 * tCredex Admin API - Users Management
 * GET /api/admin/users - List all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        phone,
        organization_id,
        created_at,
        organizations(id, name, type)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query;

    if (error) {
      console.error('Admin users query error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get deal counts per user
    const userIds = (users || []).map(u => u.id);
    const { data: dealCounts } = await supabase
      .from('deals')
      .select('user_id')
      .in('user_id', userIds);

    const dealsPerUser: Record<string, number> = {};
    for (const deal of dealCounts || []) {
      dealsPerUser[deal.user_id] = (dealsPerUser[deal.user_id] || 0) + 1;
    }

    // Format response
    const formatted = (users || []).map(u => {
      // Handle organizations - could be object, array, or null
      let org = null;
      if (u.organizations) {
        const orgData = Array.isArray(u.organizations) 
          ? u.organizations[0] 
          : u.organizations;
        if (orgData && typeof orgData === 'object') {
          org = {
            id: (orgData as Record<string, unknown>).id as string,
            name: (orgData as Record<string, unknown>).name as string,
            type: (orgData as Record<string, unknown>).type as string,
          };
        }
      }

      return {
        id: u.id,
        email: u.email,
        name: u.full_name,
        role: u.role,
        phone: u.phone,
        organization: org,
        dealCount: dealsPerUser[u.id] || 0,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json({
      users: formatted,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
