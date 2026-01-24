/**
 * Team Members API
 * Manage team members within an organization
 * SIMPLIFIED: Uses users_simplified table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOrgAdmin, handleAuthError } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/team - List team members in user's organization
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, title, avatar_url, is_active, last_login_at, created_at')
      .eq('organization_id', user.organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ members: data || [] });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/team - Invite new team member (org admin only)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { email, role, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const validRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists in this org
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('organization_id', user.organizationId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 409 }
      );
    }

    // Create user record
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role: role || 'MEMBER',
        organization_id: user.organizationId,
        organization_type: user.organizationType,
        is_active: true,
        email_verified: false,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    try {
      await supabase.from('ledger_events').insert({
        actor_type: 'human',
        actor_id: user.id,
        entity_type: 'user',
        entity_id: (data as { id: string }).id,
        action: 'team_member_invited',
        payload_json: { email, role },
      } as never);
    } catch (e) {
      // Ledger logging is optional
    }

    return NextResponse.json({
      success: true,
      message: `Team member invited: ${email}`,
      user: data,
    }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
