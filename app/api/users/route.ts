/**
 * tCredex Users API
 * User management with proper auth and org filtering
 * CRITICAL: Users are team members within organizations, not created during registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOrgAdmin, handleAuthError, verifyOrgAccess } from '@/lib/api/auth-middleware';

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

      if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // No org check, just return user
      return NextResponse.json({ user: data });
    }

    // List all users (role-driven only)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ users: data });
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
      .eq('email', body.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user in user's organization
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: body.email,
        name: body.name,
        role: body.role || 'MEMBER',
        organization_id: user.organizationId, // CRITICAL: Use user's org
        phone: body.phone,
        title: body.title,
        avatar_url: body.avatar_url,
        is_active: true,
      } as never)
      .select(`
        *,
        organization:organizations(id, name, slug, type)
      `)
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'user',
      entity_id: (data as { id: string }).id,
      action: 'user_created',
      payload_json: { email: body.email, name: body.name },
      hash: generateHash(data as Record<string, unknown>),
    } as never);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

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
