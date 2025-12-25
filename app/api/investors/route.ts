/**
 * tCredex Investors API
 * CRUD operations for Investors with Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy init
let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

// =============================================================================
// GET /api/investors - List investors with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const creditType = searchParams.get('credit_type');
    const minInvestment = searchParams.get('min_investment');
    const craMotivated = searchParams.get('cra_motivated');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = getSupabase()
      .from('investors')
      .select(`
        *,
        organization:organizations(id, name, slug, city, state)
      `)
      .order('max_investment', { ascending: false })
      .limit(limit);

    if (creditType) query = query.contains('target_credit_types', [creditType]);
    if (minInvestment) query = query.gte('max_investment', parseInt(minInvestment));
    if (craMotivated === 'true') query = query.eq('cra_motivated', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ investors: data });
  } catch (error) {
    console.error('GET /api/investors error:', error);
    return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/investors - Create investor profile
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create or get organization
    let organizationId = body.organization_id;
    
    if (!organizationId && body.organization_name) {
      const slug = body.organization_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data: org, error: orgError } = await getSupabase()
        .from('organizations')
        .insert({
          name: body.organization_name,
          slug,
          type: 'investor',
          city: body.city,
          state: body.state,
        })
        .select()
        .single();

      if (orgError) throw orgError;
      organizationId = org.id;
    }

    // Create investor profile
    const { data, error } = await getSupabase()
      .from('investors')
      .insert({
        organization_id: organizationId,
        primary_contact_name: body.primary_contact_name,
        primary_contact_email: body.primary_contact_email,
        investor_type: body.investor_type || 'Bank',
        cra_motivated: body.cra_motivated ?? true,
        min_investment: body.min_investment || 1000000,
        max_investment: body.max_investment || 25000000,
        target_credit_types: body.target_credit_types || ['NMTC'],
        target_states: body.target_states,
        accredited: body.accredited ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/investors error:', error);
    return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 });
  }
}
