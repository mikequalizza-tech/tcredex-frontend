/**
 * tCredex Admin API - Dashboard Stats
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDealsRequiringAction, getDealActivitySummary } from '@/lib/deals';

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

    // Gather stats
    const [actionStats, activitySummary, userCount, orgCount] = await Promise.all([
      getDealsRequiringAction(),
      getDealActivitySummary(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ]);

    // Get deals by program type
    const { data: programDeals } = await supabase
      .from('deals')
      .select('program_type')
      .not('program_type', 'is', null);

    const byProgram: Record<string, number> = {};
    for (const deal of programDeals || []) {
      const type = deal.program_type || 'Unknown';
      byProgram[type] = (byProgram[type] || 0) + 1;
    }

    // Get recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count: recentSignups } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Calculate total allocation
    const { data: allocationData } = await supabase
      .from('deals')
      .select('allocation_amount')
      .in('status', ['available', 'in_discussions', 'term_sheet', 'closing', 'funded']);

    const totalAllocation = (allocationData || []).reduce(
      (sum, d) => sum + (d.allocation_amount || 0),
      0
    );

    return NextResponse.json({
      overview: {
        totalDeals: activitySummary.total,
        totalUsers: userCount.count || 0,
        totalOrganizations: orgCount.count || 0,
        totalAllocation,
        recentSignups: recentSignups || 0,
      },
      actionRequired: {
        pendingReview: actionStats.pendingReview,
        needsInfo: actionStats.needsInfo,
        expiringOffers: actionStats.expiringOffers,
      },
      dealsByStatus: activitySummary.byStatus,
      dealsByProgram: byProgram,
      recentActivity: activitySummary.recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
