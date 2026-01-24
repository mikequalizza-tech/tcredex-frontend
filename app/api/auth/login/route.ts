/**
 * tCredex API - Login
 * POST /api/auth/login
 *
 * SIMPLIFIED: Uses users_simplified table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const SESSION_TTL_SECONDS = 60 * 60 * 24;

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
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !authData.session) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Step 2: Fetch user record from users (no FK joins)
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRecord) {
      console.error('[Login] User record not found:', userError);
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 401 }
      );
    }

    const typedRecord = userRecord as UserRecord;

    // Step 3: Validate user is active
    if (!typedRecord.is_active) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Step 4: Get organization details from the appropriate table
    let organization = null;
    if (typedRecord.organization_id && typedRecord.organization_type) {
      const tableName = typedRecord.organization_type === 'sponsor' ? 'sponsors'
        : typedRecord.organization_type === 'investor' ? 'investors'
        : 'cdes_merged';

      const { data: org } = await supabase
        .from(tableName)
        .select('name, slug, website, logo_url, verified, status')
        .eq('organization_id', typedRecord.organization_id)
        .single();

      if (org) {
        organization = {
          id: typedRecord.organization_id,
          name: org.name,
          slug: org.slug,
          type: typedRecord.organization_type,
          logo: org.logo_url,
          website: org.website,
          verified: org.verified || false,
        };
      }
    }

    // Step 5: Return user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: typedRecord.id,
        email: typedRecord.email,
        name: typedRecord.name,
        role: typedRecord.role,
        organizationId: typedRecord.organization_id,
        organizationType: typedRecord.organization_type,
        organization,
        avatar: typedRecord.avatar_url,
        title: typedRecord.title,
        phone: typedRecord.phone,
        isActive: typedRecord.is_active,
        emailVerified: typedRecord.email_verified,
        lastLoginAt: typedRecord.last_login_at,
        createdAt: typedRecord.created_at,
      },
    });

    // Step 6: Set secure session cookie
    const sessionToken = authData.session.access_token;
    if (sessionToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: SESSION_TTL_SECONDS,
        path: '/',
      };

      response.cookies.set({
        name: 'auth-token',
        value: sessionToken,
        ...cookieOptions,
      });

      // Backward compatibility
      response.cookies.set({
        name: 'tcredex_session',
        value: sessionToken,
        ...cookieOptions,
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', typedRecord.id);

    // Log to ledger
    try {
      await supabase.from('ledger_events').insert({
        actor_type: 'human',
        actor_id: typedRecord.id,
        entity_type: 'auth',
        entity_id: typedRecord.id,
        action: 'login',
        payload_json: { email: typedRecord.email },
      } as never);
    } catch (err) {
      console.error('[Login] Ledger error:', err);
    }

    return response;
  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
