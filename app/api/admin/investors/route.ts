/**
 * tCredex Admin API - Investors Management
 * GET /api/admin/investors - List all investors from investors table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface AdminInvestor {
  id: string;
  name: string;
  type: 'bank' | 'insurance' | 'corporate' | 'family-office' | 'fund';
  totalCapacity: number;
  deployed: number;
  available: number;
  activeDeals: number;
  targetReturn: string;
  preferredSectors: string[];
  preferredStates: string[];
  minDeal: number;
  maxDeal: number;
  status: 'active' | 'pending' | 'paused';
  contact: string;
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const adminInvestors: AdminInvestor[] = [];

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const typeFilter = searchParams.get('type');

    // Fetch from investors table
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select(`
        id,
        investor_type,
        total_capital,
        deployed_capital,
        available_capital,
        target_return,
        preferred_sectors,
        geographic_focus,
        min_investment,
        max_investment,
        status,
        primary_contact_name,
        primary_contact_email,
        organization_id,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false });

    if (!investorsError && investors) {
      for (const inv of investors) {
        const investorName = (inv.organization as any)?.name || 'Unknown Investor';
        const investorType = mapInvestorType(inv.investor_type);

        // Apply filters
        if (typeFilter && typeFilter !== 'all' && investorType !== typeFilter) continue;
        if (search && !investorName.toLowerCase().includes(search) && !inv.primary_contact_name?.toLowerCase().includes(search)) continue;

        // Count active deals for this investor
        let activeDeals = 0;
        const { count } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('investor_id', inv.id)
          .in('status', ['available', 'under_review', 'matched', 'closing']);
        activeDeals = count || 0;

        adminInvestors.push({
          id: inv.id,
          name: investorName,
          type: investorType,
          totalCapacity: Number(inv.total_capital) || 0,
          deployed: Number(inv.deployed_capital) || 0,
          available: Number(inv.available_capital) || 0,
          activeDeals,
          targetReturn: inv.target_return || 'Market Rate',
          preferredSectors: inv.preferred_sectors || [],
          preferredStates: inv.geographic_focus || [],
          minDeal: Number(inv.min_investment) || 0,
          maxDeal: Number(inv.max_investment) || 0,
          status: (inv.status as any) || 'active',
          contact: inv.primary_contact_name || '',
          email: inv.primary_contact_email || '',
        });
      }
    }

    return NextResponse.json({
      investors: adminInvestors,
      total: adminInvestors.length,
    });
  } catch (error) {
    console.error('Admin investors error:', error);
    return NextResponse.json(
      { error: 'Internal server error', investors: [] },
      { status: 500 }
    );
  }
}

function mapInvestorType(type: string | null): 'bank' | 'insurance' | 'corporate' | 'family-office' | 'fund' {
  const typeMap: Record<string, 'bank' | 'insurance' | 'corporate' | 'family-office' | 'fund'> = {
    'bank': 'bank',
    'insurance': 'insurance',
    'corporate': 'corporate',
    'family_office': 'family-office',
    'family-office': 'family-office',
    'fund': 'fund',
    'foundation': 'fund',
    'government': 'corporate',
  };
  return typeMap[type || ''] || 'fund';
}
