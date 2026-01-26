/**
 * tCredex CDEs API
 * CRUD operations for Community Development Entities
 *
 * SIMPLIFIED: Uses cdes_merged table directly
 * Each row = 1 CDE + 1 allocation year (no FK chains)
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
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '50');

    // OPTIMIZATION: Select only needed columns instead of '*'
    // Query cdes_merged directly - no FK joins needed
    let query = supabase
      .from('cdes_merged')
      .select(`
        id,
        organization_id,
        name,
        slug,
        year,
        total_allocation,
        amount_remaining,
        amount_finalized,
        min_deal_size,
        max_deal_size,
        small_deal_fund,
        service_area_type,
        service_area,
        primary_states,
        rural_focus,
        urban_focus,
        contact_name,
        contact_email,
        contact_phone,
        controlling_entity,
        predominant_financing,
        predominant_market,
        innovative_activities,
        non_metro_commitment,
        deployment_deadline,
        status,
        created_at
      `)
      .order('amount_remaining', { ascending: false })
      .limit(Math.min(limit, 100)); // Enforce max limit

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
    if (minAllocation) query = query.gte('amount_remaining', parseInt(minAllocation));
    if (smallDealFund === 'true') query = query.eq('small_deal_fund', true);
    if (year) query = query.eq('year', parseInt(year));

    const { data, error } = await query;

    if (error) throw error;

    // Map to expected format (normalize column names)
    const cdes = (data || []).map((cde: Record<string, unknown>) => ({
      id: cde.id,
      organization_id: cde.organization_id,
      name: cde.name,
      slug: cde.slug,
      year: cde.year,
      total_allocation: cde.total_allocation,
      remaining_allocation: cde.amount_remaining,
      amount_finalized: cde.amount_finalized,
      min_deal_size: cde.min_deal_size,
      max_deal_size: cde.max_deal_size,
      small_deal_fund: cde.small_deal_fund,
      service_area_type: cde.service_area_type,
      service_area: cde.service_area,
      primary_states: cde.primary_states,
      rural_focus: cde.rural_focus,
      urban_focus: cde.urban_focus,
      contact_name: cde.contact_name,
      contact_email: cde.contact_email,
      contact_phone: cde.contact_phone,
      controlling_entity: cde.controlling_entity,
      predominant_financing: cde.predominant_financing,
      predominant_market: cde.predominant_market,
      innovative_activities: cde.innovative_activities,
      non_metro_commitment: cde.non_metro_commitment,
      deployment_deadline: cde.deployment_deadline,
      status: cde.status,
      created_at: cde.created_at,
    }));

    return NextResponse.json({
      cdes,
      organizationId: user.organizationId,
      organizationType: user.organizationType,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 60 seconds
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/cdes - Create new CDE allocation year
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

    // Generate unique slug
    const baseSlug = (body.name || 'cde')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create CDE row in cdes_merged (one row = one CDE + one allocation year)
    const { data, error } = await supabase
      .from('cdes_merged')
      .insert({
        organization_id: organizationId,
        name: body.name,
        slug: uniqueSlug,
        year: body.year || new Date().getFullYear(),
        allocation_type: body.allocation_type || 'federal',
        total_allocation: body.total_allocation || 0,
        amount_finalized: body.amount_finalized || 0,
        amount_remaining: body.remaining_allocation || body.total_allocation || 0,
        non_metro_commitment: body.non_metro_commitment || 0,
        deployment_deadline: body.deployment_deadline,
        service_area: body.service_area,
        service_area_type: body.service_area_type || 'national',
        controlling_entity: body.controlling_entity,
        predominant_financing: body.predominant_financing,
        predominant_market: body.predominant_market,
        innovative_activities: body.innovative_activities,
        contact_name: body.primary_contact_name || body.contact_name,
        contact_phone: body.primary_contact_phone || body.contact_phone,
        contact_email: body.primary_contact_email || body.contact_email,
        primary_states: body.primary_states || [],
        min_deal_size: body.min_deal_size || 1000000,
        max_deal_size: body.max_deal_size || 15000000,
        small_deal_fund: body.small_deal_fund || false,
        rural_focus: body.rural_focus || false,
        urban_focus: body.urban_focus ?? true,
        status: 'active',
      } as never)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      organizationId: user.organizationId,
    }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
