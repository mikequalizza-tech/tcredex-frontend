/**
 * tCredex Admin API - CDEs Management
 * GET /api/admin/cdes - List all CDEs from cdes table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface AdminCDE {
  id: string;
  name: string;
  allocation: number;
  deployed: number;
  available: number;
  activeDeals: number;
  states: string[];
  sectors: string[];
  minDeal: number;
  maxDeal: number;
  status: 'active' | 'pending' | 'paused';
  contact: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const adminCDEs: AdminCDE[] = [];

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    // Fetch from cdes table
    const { data: cdes, error: cdesError } = await supabase
      .from('cdes')
      .select(`
        id,
        name,
        total_allocation,
        deployed_allocation,
        remaining_allocation,
        primary_states,
        target_sectors,
        min_deal_size,
        max_deal_size,
        status,
        primary_contact_name,
        primary_contact_email,
        organization_id,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (!cdesError && cdes) {
      for (const cde of cdes) {
        const cdeName = cde.name || (cde.organization as any)?.name || 'Unknown CDE';

        // Apply search filter
        if (search && !cdeName.toLowerCase().includes(search)) continue;

        // Count active deals for this CDE
        let activeDeals = 0;
        const { count } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_cde_id', cde.id)
          .in('status', ['available', 'under_review', 'matched', 'closing']);
        activeDeals = count || 0;

        adminCDEs.push({
          id: cde.id,
          name: cdeName,
          allocation: Number(cde.total_allocation) || 0,
          deployed: Number(cde.deployed_allocation) || 0,
          available: Number(cde.remaining_allocation) || 0,
          activeDeals,
          states: cde.primary_states || [],
          sectors: cde.target_sectors || [],
          minDeal: Number(cde.min_deal_size) || 0,
          maxDeal: Number(cde.max_deal_size) || 0,
          status: (cde.status as any) || 'active',
          contact: cde.primary_contact_name || '',
          email: cde.primary_contact_email || '',
        });
      }
    }

    return NextResponse.json({
      cdes: adminCDEs,
      total: adminCDEs.length,
    });
  } catch (error) {
    console.error('Admin CDEs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', cdes: [] },
      { status: 500 }
    );
  }
}
