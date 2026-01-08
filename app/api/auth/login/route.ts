/**
 * tCredex API - Login
 * POST /api/auth/login
 *
 * CRITICAL FLOW:
 * 1. Authenticate with Supabase Auth
 * 2. Fetch user record from users table (source of truth)
 * 3. Validate organization exists
 * 4. Return user data with organization and role
 * 5. Set secure session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const SESSION_TTL_SECONDS = 60 * 60 * 24;

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

    // Step 2: Fetch user record from users table (source of truth)
    const { data: userRecord, error: userError } = await supabase
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
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRecord) {
      console.error('[Login] User record not found:', userError);
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 401 }
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

    // Step 3: Validate user is active
    if (!typedRecord.is_active) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      );
    }

    // Step 4: Validate organization exists
    if (!typedRecord.organization) {
      console.error('[Login] Organization not found for user:', typedRecord.id);
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 403 }
      );
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

    // Log to ledger
    try {
      await supabase.from('ledger_events').insert({
        actor_type: 'human',
        actor_id: typedRecord.id,
        entity_type: 'auth',
        entity_id: typedRecord.id,
        action: 'login',
        payload_json: { email: typedRecord.email },
        hash: generateHash({ email: typedRecord.email, timestamp: Date.now() }),
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
