/**
 * tCredex CDEs API
 * CRUD operations for Community Development Entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabase = getSupabaseAdmin();

// =============================================================================
// GET /api/cdes - List CDEs with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const minAllocation = searchParams.get('min_allocation');
    const smallDealFund = searchParams.get('small_deal_fund');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('cdes')
      .select(`
        *,
        organization:organizations(name, slug, website, city, state),
        allocations:cde_allocations(*)
      `)
      .order('remaining_allocation', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (state) query = query.contains('primary_states', [state]);
    if (minAllocation) query = query.gte('remaining_allocation', parseInt(minAllocation));
    if (smallDealFund === 'true') query = query.eq('small_deal_fund', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ cdes: data });
  } catch (error) {
    console.error('GET /api/cdes error:', error);
    return NextResponse.json({ error: 'Failed to fetch CDEs' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/cdes - Create new CDE profile
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // First create or get organization
    let organizationId = body.organization_id;
    
    if (!organizationId && body.organization_name) {
      const slug = body.organization_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: body.organization_name,
          slug: slug,
          type: 'cde',
          website: body.website,
          city: body.city,
          state: body.state,
        } as never)
        .select()
        .single();

      if (orgError) throw orgError;
      organizationId = (org as { id: string }).id;
    }

    // Create CDE profile
    const { data, error } = await supabase
      .from('cdes')
      .insert({
        organization_id: organizationId,
        certification_number: body.certification_number,
        year_established: body.year_established,
        primary_contact_name: body.primary_contact_name,
        primary_contact_email: body.primary_contact_email,
        primary_contact_phone: body.primary_contact_phone,
        total_allocation: body.total_allocation || 0,
        remaining_allocation: body.remaining_allocation || 0,
        min_deal_size: body.min_deal_size || 1000000,
        max_deal_size: body.max_deal_size || 15000000,
        small_deal_fund: body.small_deal_fund || false,
        service_area_type: body.service_area_type || 'national',
        primary_states: body.primary_states || [],
        rural_focus: body.rural_focus || false,
        urban_focus: body.urban_focus || true,
        mission_statement: body.mission_statement,
        impact_priorities: body.impact_priorities || [],
        target_sectors: body.target_sectors || [],
        nmtc_experience: body.nmtc_experience ?? true,
        htc_experience: body.htc_experience || false,
        status: 'active',
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Create allocations if provided
    if (body.allocations && body.allocations.length > 0) {
      const typedData = data as { id: string };
      const allocationsToInsert = body.allocations.map((a: Record<string, unknown>) => ({
        cde_id: typedData.id,
        type: a.type,
        year: a.year,
        state_code: a.state_code,
        awarded_amount: a.awarded_amount,
        available_on_platform: a.available_on_platform,
        deployment_deadline: a.deployment_deadline,
      }));

      await supabase.from('cde_allocations').insert(allocationsToInsert as never);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/cdes error:', error);
    return NextResponse.json({ error: 'Failed to create CDE' }, { status: 500 });
  }
}
