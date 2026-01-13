import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/me
 * Returns current authenticated user with organization and role
 * Uses Clerk for authentication, Supabase for user/organization data
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

    // Try to find user by clerk_id
    let userRecord;
    const { data: clerkMatch } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        organization_id,
        avatar_url,
        title,
        phone,
        is_active,
        email_verified,
        last_login_at,
        created_at,
        organization:organizations(
          id,
          name,
          slug,
          type,
          logo_url,
          website,
          verified
        )
      `)
      .eq('clerk_id', userId)
      .single();

    if (clerkMatch) {
      userRecord = clerkMatch;
    } else {
      // Try to find by email for migration
      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
      if (primaryEmail) {
        const { data: emailMatch } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            role,
            organization_id,
            avatar_url,
            title,
            phone,
            is_active,
            email_verified,
            last_login_at,
            created_at,
            organization:organizations(
              id,
              name,
              slug,
              type,
              logo_url,
              website,
              verified
            )
          `)
          .eq('email', primaryEmail.toLowerCase())
          .single();

        if (emailMatch) {
          // Update user with clerk_id for future lookups
          await supabase
            .from('users')
            .update({ clerk_id: userId })
            .eq('id', (emailMatch as { id: string }).id);

          userRecord = emailMatch;
        }
      }
    }

    if (!userRecord) {
      // User authenticated with Clerk but not in our database
      // Return partial info so frontend can redirect to registration/onboarding
      console.warn(`[Auth] User ${userId} authenticated with Clerk but not found in database`);
      return NextResponse.json({
        user: null,
        clerkUser: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName,
          avatar: clerkUser.imageUrl,
        },
        needsRegistration: true,
        message: 'Please complete your registration to access the platform'
      });
    }

    const typedRecord = userRecord as {
      id: string;
      email: string;
      name: string;
      role: string;
      organization_id: string;
      avatar_url?: string;
      title?: string;
      phone?: string;
      is_active: boolean;
      email_verified: boolean;
      last_login_at?: string;
      created_at: string;
      organization: {
        id: string;
        name: string;
        slug: string;
        type: string;
        logo_url?: string;
        website?: string;
        verified: boolean;
      };
    };

    // Validate organization type (including admin)
    const { isValidAllOrgType } = await import('@/lib/roles');
    if (!isValidAllOrgType(typedRecord.organization.type)) {
      console.error(`[Auth] Invalid organization type: ${typedRecord.organization.type} for user ${userId}`);
      return NextResponse.json(
        { 
          error: 'Invalid organization configuration. Please contact support.',
          details: {
            invalidOrganizationType: typedRecord.organization.type,
            organizationId: typedRecord.organization.id,
          }
        },
        { status: 500 }
      );
    }

    // Validate user role
    const validUserRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'];
    if (!validUserRoles.includes(typedRecord.role)) {
      console.error(`[Auth] Invalid user role: ${typedRecord.role} for user ${userId}`);
      return NextResponse.json(
        { 
          error: 'Invalid user role. Please contact support.', 
          invalidRole: typedRecord.role 
        },
        { status: 500 }
      );
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', typedRecord.id);

    return NextResponse.json({
      user: {
        id: typedRecord.id,
        email: typedRecord.email,
        name: typedRecord.name,
        role: typedRecord.role,
        organizationId: typedRecord.organization_id,
        organization: {
          id: typedRecord.organization.id,
          name: typedRecord.organization.name,
          slug: typedRecord.organization.slug,
          type: typedRecord.organization.type,
          logo: typedRecord.organization.logo_url,
          website: typedRecord.organization.website,
          verified: typedRecord.organization.verified,
        },
        avatar: typedRecord.avatar_url || clerkUser.imageUrl,
        title: typedRecord.title,
        phone: typedRecord.phone,
        isActive: typedRecord.is_active,
        emailVerified: typedRecord.email_verified,
        lastLoginAt: typedRecord.last_login_at,
        createdAt: typedRecord.created_at,
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
