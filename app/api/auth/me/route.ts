import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/me
 * Returns current authenticated user with organization and role
<<<<<<< HEAD
 * Uses Clerk for authentication, Supabase for user/organization data
 *
 * SIMPLIFIED: Uses users_simplified table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
=======
 * Uses Supabase for authentication and user/organization data
 *
 * Model:
 * - users.organization_id points to sponsors.id / cdes.id / investors.id
 * - users.role_type indicates which table to join (sponsor | cde | investor)
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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

<<<<<<< HEAD
    // Get Clerk user details
    let clerkUser;
    try {
      clerkUser = await currentUser();
    } catch (clerkError: any) {
      // User was deleted from Clerk - return 401 to force re-auth
      if (clerkError?.status === 404) {
        return NextResponse.json(
          { error: 'User not found', needsSignOut: true },
          { status: 401 }
        );
      }
      throw clerkError;
    }

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // User record type for users_simplified
    type UserRecord = {
      id: string;
      clerk_id: string | null;
      email: string;
      name: string;
      avatar_url: string | null;
      phone: string | null;
      title: string | null;
      organization_id: string | null;
      organization_type: string | null;
      role: string;
      is_active: boolean;
      email_verified: boolean;
      last_login_at: string | null;
      created_at: string;
      updated_at: string;
    };

    // Try to find user by clerk_id (simplified table - no FK joins)
    let userRecord: UserRecord | null = null;
    const { data: clerkMatch } = await supabase
      .from('users_simplified')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (clerkMatch) {
      userRecord = clerkMatch as UserRecord;
    } else {
      // Try to find by email for migration
      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
      if (primaryEmail) {
        const { data: emailMatch } = await supabase
          .from('users_simplified')
          .select('*')
          .eq('email', primaryEmail.toLowerCase())
          .single();

        if (emailMatch) {
          // Update user with clerk_id for future lookups
          await supabase
            .from('users_simplified')
            .update({ clerk_id: userId })
            .eq('id', (emailMatch as UserRecord).id);

          userRecord = emailMatch as UserRecord;
        }
      }
    }

=======
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

>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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

<<<<<<< HEAD
    // Get organization details from the appropriate table based on type
    let organization = null;
    if (userRecord.organization_id && userRecord.organization_type) {
      const tableName = userRecord.organization_type === 'sponsor' ? 'sponsors_simplified'
        : userRecord.organization_type === 'investor' ? 'investors_simplified'
        : 'cdes_merged';

      const { data: org } = await supabase
        .from(tableName)
        .select('name, slug, website, logo_url, verified, status')
        .eq('organization_id', userRecord.organization_id)
        .single();

      if (org) {
        organization = {
          id: userRecord.organization_id,
          name: org.name,
          slug: org.slug,
          type: userRecord.organization_type,
          logo: org.logo_url,
          website: org.website,
          verified: org.verified || false,
        };
      }
    }

    // Update last login
    await supabase
      .from('users_simplified')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userRecord.id);

    return NextResponse.json({
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        organizationId: userRecord.organization_id,
        organizationType: userRecord.organization_type,
        organization,
        avatar: userRecord.avatar_url || clerkUser.imageUrl,
        title: userRecord.title,
        phone: userRecord.phone,
        isActive: userRecord.is_active,
        emailVerified: userRecord.email_verified,
        lastLoginAt: userRecord.last_login_at,
        createdAt: userRecord.created_at,
      },
    });
=======
    return await buildUserResponse(supabaseAdmin, userRecord, authUser);
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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
