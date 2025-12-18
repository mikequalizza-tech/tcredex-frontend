/**
 * tCredex API - Single Deal
 * GET /api/deals/[id] - Get deal by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = supabaseAdmin;
    const { id } = await context.params;

    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        deal_parties(*),
        deal_documents(*),
        deal_timeline(*)
      `)
      .eq('id', id)
      .single();

    if (error || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Calculate missing docs
    const requiredDocs = [
      'Site Control',
      'Phase I Environmental',
      'Financial Projections',
      'Business Plan',
      'Entity Documents',
    ];
    const uploadedDocs = (deal.deal_documents || []).map((d: any) => d.doc_type);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

    // Format timeline
    const timeline = (deal.deal_timeline || []).map((t: any) => ({
      milestone: t.milestone,
      date: t.target_date,
      completed: t.completed,
    }));

    // Format parties
    const parties = (deal.deal_parties || []).map((p: any) => ({
      role: p.role,
      name: p.contact_name,
      org: p.organization_name,
    }));

    // Transform to mobile-friendly format
    const formatted = {
      id: deal.id,
      projectName: deal.project_name,
      sponsorName: deal.sponsor_name,
      programType: deal.program_type,
      status: deal.status,
      allocation: deal.allocation_amount || 0,
      totalProjectCost: deal.total_project_cost || 0,
      financingGap: deal.financing_gap || 0,
      city: deal.city,
      state: deal.state,
      censusTract: deal.census_tract,
      description: deal.project_description,
      submittedDate: deal.created_at,
      timeline,
      missingDocs,
      parties,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Deal detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
