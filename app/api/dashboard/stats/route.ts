/**
 * Dashboard Stats API
 * Returns real-time statistics for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Get sponsor_id if user is a sponsor
    let sponsorId: string | null = null;
    if (user.organizationType === 'sponsor') {
      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('id')
        .eq('organization_id', user.organizationId)
        .single();
      sponsorId = sponsorData?.id || null;
    }

    // Get total deals for sponsor
    let totalDeals = 0;
    let totalAllocation = 0;
    let inClosing = 0;
    let matched = 0;

    if (sponsorId) {
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id, status, nmtc_financing_requested, programs, htc_amount, state_nmtc_allocation, oz_investment, lihtc_basis')
        .eq('sponsor_id', sponsorId);

      if (!dealsError && dealsData) {
        totalDeals = dealsData.length;
        inClosing = dealsData.filter(d => d.status === 'closing').length;
        matched = dealsData.filter(d => d.status === 'matched').length;

        // Calculate total allocation across all program types
        totalAllocation = dealsData.reduce((sum, deal) => {
          const programs = deal.programs || [];
          let dealAllocation = 0;

          if (programs.includes('NMTC')) {
            dealAllocation += Number(deal.nmtc_financing_requested) || 0;
            dealAllocation += Number(deal.state_nmtc_allocation) || 0;
          }
          if (programs.includes('HTC')) {
            dealAllocation += Number(deal.htc_amount) || 0;
          }
          if (programs.includes('OZ')) {
            dealAllocation += Number(deal.oz_investment) || 0;
          }
          if (programs.includes('LIHTC')) {
            dealAllocation += Number(deal.lihtc_basis) || 0;
          }

          return sum + dealAllocation;
        }, 0);
      }
    }

    // OPTIMIZATION: Parallelize independent queries
    const [
      { count: activeCDEsCount },
      { count: activeInvestorsCount },
      { data: cdesData }
    ] = await Promise.all([
      // Get total active CDEs with allocation
      supabase
        .from('cdes_merged')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('amount_remaining', 0),
      // Get total active investors (investors table doesn't have status column)
      supabase
        .from('investors')
        .select('*', { count: 'exact', head: true }),
      // Calculate total NMTC allocation available (sum of all active CDEs)
      supabase
        .from('cdes_merged')
        .select('amount_remaining')
        .eq('status', 'active')
        .gt('amount_remaining', 0)
    ]);

    const totalNMTCAvailable = cdesData?.reduce((sum, cde) => {
      return sum + (Number(cde.amount_remaining) || 0);
    }, 0) || 0;

    return NextResponse.json({
      stats: {
        totalDeals,
        totalAllocation,
        inClosing,
        matched,
        activeCDEs: activeCDEsCount || 0,
        activeInvestors: activeInvestorsCount || 0,
        totalNMTCAvailable,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
