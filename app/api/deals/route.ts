/**
 * tCredex Deals API
 * CRUD operations for deals with proper auth and org filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError, verifyDealAccess } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/deals - List deals with filters or fetch single deal by id
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Fetch single deal by ID
    if (id) {
      // Verify user can access this deal
      await verifyDealAccess(request, user, id, 'view');

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }

      return NextResponse.json({ deal: data }, { status: 200 });
    }

    // List deals with org filtering
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const program = searchParams.get('program');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with org filtering based on user type
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // CRITICAL: Filter by organization and role
    if (user.organizationType === 'sponsor') {
      // Sponsors see only their own deals
      query = query.eq('sponsor_organization_id', user.organizationId);
    } else if (user.organizationType === 'cde') {
      // CDEs see: assigned deals + public/available deals
      // FIXED: Get CDE ID first, then filter properly
      const { data: cdeRecord } = await supabase
        .from('cdes')
        .select('id')
        .eq('organization_id', user.organizationId)
        .single();
      
      if (cdeRecord) {
        // CDE can see deals assigned to them OR public deals
        query = query.or(
          `assigned_cde_id.eq.${cdeRecord.id},status.in.(available,seeking_capital,matched)`
        );
      } else {
        // CDE has no profile yet, show only public deals
        query = query.in('status', ['available', 'seeking_capital', 'matched']);
      }
    } else if (user.organizationType === 'investor') {
      // Investors see: public deals + deals with their commitments
      // FIXED: Get investor ID first, then filter properly
      const { data: investorRecord } = await supabase
        .from('investors')
        .select('id')
        .eq('organization_id', user.organizationId)
        .single();
      
      if (investorRecord) {
        // Investor can see public deals OR deals they're involved in
        query = query.or(
          `status.in.(available,seeking_capital,matched),investor_id.eq.${investorRecord.id}`
        );
      } else {
        // Investor has no profile yet, show only public deals
        query = query.in('status', ['available', 'seeking_capital', 'matched']);
      }
    }
    // Admin sees all deals (no filter)

    // Apply additional filters
    if (status) query = query.eq('status', status as any);
    if (state) query = query.eq('state', state);
    if (program) query = query.contains('programs', [program]);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      deals: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/deals - Create new deal
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication and org admin role
    const user = await requireAuth(request);
    
    if (user.userRole !== 'ORG_ADMIN') {
      return NextResponse.json(
        { error: 'Only organization admins can create deals' },
        { status: 403 }
      );
    }

    // Only sponsors can create deals
    if (user.organizationType !== 'sponsor') {
      return NextResponse.json(
        { error: 'Only sponsors can create deals' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Validate required fields
    if (!body.project_name) {
      return NextResponse.json(
        { error: 'project_name is required' },
        { status: 400 }
      );
    }

    // Insert deal with user's organization as sponsor
    const { data, error } = await supabase
      .from('deals')
      .insert({
        project_name: body.project_name,
        sponsor_organization_id: user.organizationId, // CRITICAL: Use user's org
        sponsor_name: body.sponsor_name,
        programs: body.programs || ['NMTC'],
        program_level: body.program_level || 'federal',
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        census_tract: body.census_tract,
        latitude: body.latitude,
        longitude: body.longitude,
        project_type: body.project_type,
        venture_type: body.venture_type,
        project_description: body.project_description,
        total_project_cost: body.total_project_cost,
        nmtc_financing_requested: body.nmtc_financing_requested,
        financing_gap: body.financing_gap,
        jobs_created: body.jobs_created,
        jobs_retained: body.jobs_retained,
        intake_data: body.intake_data || {},
        status: 'draft',
        visible: false,
        readiness_score: 0,
        tier: 1,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'deal',
      entity_id: (data as { id: string }).id,
      action: 'deal_created',
      payload_json: { project_name: body.project_name },
      hash: generateHash(data as Record<string, unknown>),
    } as never);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// Simple hash for ledger (in production, use proper chain)
function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
