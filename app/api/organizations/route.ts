/**
 * tCredex Organizations API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET /api/organizations - List organizations
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('organizations')
      .select('*')
      .order('name')
      .limit(limit);

    if (type) query = query.eq('type', type);
    if (verified === 'true') query = query.eq('verified', true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ organizations: data });
  } catch (error) {
    console.error('GET /api/organizations error:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/organizations - Create organization
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check for existing slug
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        slug,
        type: body.type,
        logo_url: body.logo_url,
        website: body.website,
        phone: body.phone,
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/organizations error:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
