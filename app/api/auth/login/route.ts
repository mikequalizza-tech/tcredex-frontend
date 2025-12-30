/**
 * tCredex API - Login
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { recordAuditEvent } from '@/lib/utils/audit';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', data.user.id)
      .single();

    const response = NextResponse.json({
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || data.user.email?.split('@')[0],
        role: profile?.role || 'sponsor',
        organization: profile?.organizations ? {
          id: profile.organizations.id,
          name: profile.organizations.name,
          type: profile.organizations.type,
        } : null,
      },
    });

    // Set secure session cookie for middleware-based auth
    const sessionToken = data.session?.access_token;
    if (sessionToken) {
      response.cookies.set({
        name: 'tcredex_session',
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });
    }
    response.cookies.set({
      name: 'tcredex_role',
      value: profile?.role || 'sponsor',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    // Audit login activity (best-effort)
    await recordAuditEvent({
      action: 'login',
      userId: data.user.id,
      orgId: profile?.organizations?.id || null,
      role: profile?.role || 'sponsor',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
