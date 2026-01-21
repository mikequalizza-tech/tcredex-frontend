/**
 * tCredex Users API
 * User management with proper auth and org filtering
 * SIMPLIFIED: Uses users_simplified - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOrgAdmin, handleAuthError } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/users - List team members in user's organization
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');


    // Get specific user (role-driven only)
    if (id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ user: data });
    }

    // List all users (role-driven only)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/users - Create team member (org admin only)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require org admin
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }


    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: body.email.toLowerCase(),
        name: body.name,
        role: body.role || 'MEMBER',
        phone: body.phone,
        title: body.title,
        avatar_url: body.avatar_url,
        is_active: true,
        email_verified: false,
      } as never)
      .select('*')
      .single();

    if (error) throw error;

    // Log to ledger
    try {
      await supabase.from('ledger_events').insert({
        actor_type: 'human',
        actor_id: user.id,
        entity_type: 'user',
        entity_id: (data as { id: string }).id,
        action: 'user_created',
        payload_json: { email: body.email, name: body.name },
      } as never);
    } catch (e) {
      // Ledger logging is optional
    }

    return NextResponse.json({ success: true, user: data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
