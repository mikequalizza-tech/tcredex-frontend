/**
 * tCredex Users API
 * User management with Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET /api/users - List users (with org filter)
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const organizationId = searchParams.get('organization_id');
    const role = searchParams.get('role');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('users')
      .select(`
        *,
        organization:organizations(id, name, slug, type)
      `)
      .eq('is_active', true)
      .limit(limit);

    if (organizationId) query = query.eq('organization_id', organizationId);
    if (role) query = query.eq('role', role);
    if (email) query = query.eq('email', email);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/users - Create user
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: body.email,
        name: body.name,
        role: body.role || 'MEMBER',
        organization_id: body.organization_id,
        phone: body.phone,
        title: body.title,
        avatar_url: body.avatar_url,
      })
      .select(`
        *,
        organization:organizations(id, name, slug, type)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
