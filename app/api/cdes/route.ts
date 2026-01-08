/**
 * tCredex CDEs API
 * CRUD operations for Community Development Entities
 * 
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/cdes - List CDEs with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const minAllocation = searchParams.get('min_allocation');
    const smallDealFund = searchParams.get('small_deal_fund');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('cdes')
      .select(`
        id,
        organization_id,
        certification_number,
        year_established,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        total_allocation,
        remaining_allocation,
        min_deal_size,
        max_deal_size,
        small_deal_fund,
        service_area_type,
        primary_states,
        rural_focus,
        urban_focus,
        mission_statement,
        impact_priorities,
        target_sectors,
        nmtc_experience,
        htc_experience,
        status,
        created_at,
        organization:organizations(id, name, slug, website, city, state),
        allocations:cde_allocations(*)
      `)
      .order('remaining_allocation', { ascending: false })
      .limit(limit);

    // CRITICAL: Filter by organization based on user type
    if (user.organizationType === 'cde') {
      // CDEs see only their own profile
      query = query.eq('organization_id', user.organizationId);
    } else if (user.organizationType === 'sponsor' || user.organizationType === 'investor') {
      // Sponsors and investors see all active CDEs (public view)
      query = query.eq('status', 'active');
    }
    // Admin sees all CDEs (no filter)

    if (status) query = query.eq('status', status);
    if (state) query = query.contains('primary_states', [state]);
    if (minAllocation) query = query.gte('remaining_allocation', parseInt(minAllocation));
    if (smallDealFund === 'true') query = query.eq('small_deal_fund', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      cdes: data,
      organizationId: user.organizationId,
      organizationType: user.organizationType,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/cdes - Create new CDE profile
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication and ORG_ADMIN role
    const user = await requireAuth(request);
    
    if (user.organizationType !== 'cde' || user.userRole !== 'ORG_ADMIN') {
      return NextResponse.json(
        { error: 'Only CDE organization admins can create CDE profiles' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // CRITICAL: CDE profile must belong to user's organization
    const organizationId = user.organizationId;

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

    const typedData = data as Record<string, unknown> & { id: string };

    // Create allocations if provided
    if (body.allocations && body.allocations.length > 0) {
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

    return NextResponse.json({
      ...typedData,
      organizationId: user.organizationId,
    }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
