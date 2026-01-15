import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/me
 * Returns current authenticated user with organization and role
 * Uses Clerk for authentication, Supabase for user/organization data
 *
 * SIMPLIFIED: Uses users_simplified table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
 */
export async function GET(request: NextRequest) {
  try {
    // Get Clerk session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    if (!userRecord) {
      // User authenticated with Clerk but not in our database
      // Return partial info so frontend can redirect to registration
      return NextResponse.json({
        user: null,
        clerkUser: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName,
          avatar: clerkUser.imageUrl,
        },
        needsRegistration: true,
      });
    }

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
  } catch (error) {
    console.error('[API] /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
