import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/me
 * Returns current authenticated user with organization and role
 * Uses Supabase for authentication and user/organization data
 *
 * Model:
 * - users.organization_id points to sponsors.id / cdes.id / investors.id
 * - users.role_type indicates which table to join (sponsor | cde | investor)
 */
export async function GET(request: NextRequest) {
  try {
    // Get Supabase auth session
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find user by Supabase Auth ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        organization_id,
        role_type,
        avatar_url,
        title,
        phone,
        is_active,
        email_verified,
        last_login_at,
        created_at
      `)
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      // User authenticated with Supabase but not in our database
      return NextResponse.json({
        user: null,
        authUser: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.first_name,
        },
        needsRegistration: true,
      });
    }

    return await buildUserResponse(supabaseAdmin, userRecord, authUser);
  } catch (error) {
    console.error('[API] /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build the user response, fetching org data from the correct role table
 */
async function buildUserResponse(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userRecord: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id: string | null;
    role_type: string | null;
    avatar_url?: string;
    title?: string;
    phone?: string;
    is_active: boolean;
    email_verified: boolean;
    last_login_at?: string;
    created_at: string;
  },
  authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  // Update last login
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userRecord.id);

  // Fetch organization data from the correct role table
  let organization = null;
  if (userRecord.organization_id && userRecord.role_type) {
    const roleTable = userRecord.role_type === 'sponsor'
      ? 'sponsors'
      : userRecord.role_type === 'cde'
        ? 'cdes'
        : 'investors';

    const { data: orgData } = await supabase
      .from(roleTable)
      .select('id, primary_contact_name, primary_contact_email')
      .eq('id', userRecord.organization_id)
      .single();

    if (orgData) {
      organization = {
        id: orgData.id,
        name: orgData.primary_contact_name || 'Organization',
        type: userRecord.role_type,
      };
    }
  }

  return NextResponse.json({
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      roleType: userRecord.role_type,
      organizationId: userRecord.organization_id,
      organization,
      avatar: userRecord.avatar_url,
      title: userRecord.title,
      phone: userRecord.phone,
      isActive: userRecord.is_active,
      emailVerified: userRecord.email_verified,
      lastLoginAt: userRecord.last_login_at,
      createdAt: userRecord.created_at,
    },
  });
}
