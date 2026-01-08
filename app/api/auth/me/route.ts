import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

/**
 * GET /api/auth/me
 * Returns current authenticated user with organization and role
 * CRITICAL: Uses requireAuth() to validate token and fetch user data
 */
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Use requireAuth to validate token and get user context
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Fetch full user record with organization
    const { data: userRecord, error } = await supabase
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
      .eq('id', user.id)
      .single();

    if (error || !userRecord) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      );
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
        avatar: typedRecord.avatar_url,
        title: typedRecord.title,
        phone: typedRecord.phone,
        isActive: typedRecord.is_active,
        emailVerified: typedRecord.email_verified,
        lastLoginAt: typedRecord.last_login_at,
        createdAt: typedRecord.created_at,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
