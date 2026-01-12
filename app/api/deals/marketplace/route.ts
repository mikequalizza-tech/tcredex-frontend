/**
 * Public Marketplace Deals API
 * Returns visible deals for the homepage - no auth required
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching marketplace deals:', error);
      return NextResponse.json({ deals: [] }, { status: 200 });
    }

    // Map to client-friendly format
    const deals = (data || []).map((deal: any) => ({
      id: deal.id,
      projectName: deal.project_name,
      sponsorName: deal.sponsor_name || 'Unknown Sponsor',
      programType: (deal.programs && deal.programs[0]) || 'NMTC',
      allocation: Number(deal.nmtc_financing_requested) || Number(deal.total_project_cost) || 0,
      creditPrice: 0.76,
      state: deal.state || '',
      city: deal.city || '',
      description: deal.project_description || '',
      visible: true,
    }));

    return NextResponse.json({ deals }, { status: 200 });
  } catch (error) {
    console.error('Marketplace deals error:', error);
    return NextResponse.json({ deals: [] }, { status: 200 });
  }
}
