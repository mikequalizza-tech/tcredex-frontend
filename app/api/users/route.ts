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
<<<<<<< HEAD
        .from('users_simplified')
=======
        .from('users')
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

<<<<<<< HEAD
      type UserRecord = {
        id: string;
        organization_id: string | null;
        organization_type: string | null;
      };
      const typedData = data as UserRecord;

      // CRITICAL: Verify user belongs to same org or is admin
      if (user.organizationId !== typedData.organization_id && user.organizationType !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have access to this user' },
          { status: 403 }
        );
      }

      // Get organization details if needed
      let organization = null;
      if (typedData.organization_id && typedData.organization_type) {
        const tableName = typedData.organization_type === 'sponsor' ? 'sponsors_simplified'
          : typedData.organization_type === 'investor' ? 'investors_simplified'
          : 'cdes_merged';
        const { data: org } = await supabase
          .from(tableName)
          .select('name, slug')
          .eq('organization_id', typedData.organization_id)
          .single();
        if (org) {
          organization = {
            id: typedData.organization_id,
            name: (org as { name: string; slug: string }).name,
            slug: (org as { name: string; slug: string }).slug,
            type: typedData.organization_type,
          };
        }
      }

      return NextResponse.json({ user: { ...data, organization } });
=======
      // No org check, just return user
      return NextResponse.json({ user: data });
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
    }

    // List all users (role-driven only)
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('users_simplified')
      .select('id, email, name, role, title, avatar_url, is_active, last_login_at, created_at, organization_id, organization_type')
      .eq('organization_id', user.organizationId)
=======
      .from('users')
      .select('*')
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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

    // Check if user already exists in this organization
    const { data: existing } = await supabase
      .from('users_simplified')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .eq('organization_id', user.organizationId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists in this organization' },
        { status: 409 }
      );
    }

    // Create user in user's organization
    const { data, error } = await supabase
      .from('users_simplified')
      .insert({
        email: body.email.toLowerCase(),
        name: body.name,
        role: body.role || 'MEMBER',
        organization_id: user.organizationId, // CRITICAL: Use user's org
        organization_type: user.organizationType, // Use user's org type
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
