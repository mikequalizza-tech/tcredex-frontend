/**
 * tCredex Deals API
 * CRUD operations for deals with Supabase persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// =============================================================================
// GET /api/deals - List deals with filters
// =============================================================================
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const program = searchParams.get('program');
    const sponsorId = searchParams.get('sponsor_id');
    const cdeId = searchParams.get('cde_id');
    const visible = searchParams.get('visible');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (state) query = query.eq('state', state);
    if (program) query = query.contains('programs', [program]);
    if (sponsorId) query = query.eq('sponsor_id', sponsorId);
    if (cdeId) query = query.eq('assigned_cde_id', cdeId);
    if (visible === 'true') query = query.eq('visible', true);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      deals: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/deals - Create new deal
// =============================================================================
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.project_name) {
      return NextResponse.json(
        { error: 'project_name is required' },
        { status: 400 }
      );
    }

    // Insert deal
    const { data, error } = await supabase
      .from('deals')
      .insert({
        project_name: body.project_name,
        sponsor_id: body.sponsor_id,
        sponsor_name: body.sponsor_name,
        sponsor_organization_id: body.sponsor_organization_id,
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
      })
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: body.created_by || 'unknown',
      entity_type: 'application',
      entity_id: data.id,
      action: 'application_created',
      payload_json: { project_name: body.project_name },
      hash: generateHash(data),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
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
