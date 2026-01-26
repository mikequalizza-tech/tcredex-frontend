/**
 * tCredex API - Register
 * POST /api/auth/register
 *
 * CRITICAL FLOW:
 * 1. Create Supabase auth user (email confirmed)
 * 2. Create organization (always new, unique slug)
 * 3. Create user record in users table (links auth to org)
 * 4. Create role-specific record (sponsors/cdes/investors)
 * 5. Send confirmation email
 * 6. Return session token
 *
 * KEY POINTS:
 * - Users table is source of truth for roles and org membership
 * - Each registration creates ONE new organization
 * - User role is ORG_ADMIN (they own their org)
 * - Organization type determines dashboard and permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { email as emailService } from '@/lib/email/send';


// Unified registration flow with robust org/role logic and error handling
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName, role } = await request.json();
    // Validate required fields
    if (!email || !password || !name || !organizationName || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    // Validate role
    const validRoles = ['sponsor', 'cde', 'investor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be sponsor, cde, or investor' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const lowerEmail = email.toLowerCase();

    // Step 1: Create or reuse Supabase Auth user
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: lowerEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role },
    });

    let authUser = created?.user || null;

    if (!authUser) {
      if (createError && createError.message?.toLowerCase().includes('already registered')) {
        // Supabase admin API lacks a direct getUserByEmail; paginate and search.
        let page = 1;
        const perPage = 1000;
        let foundUser: any = null;
        while (!foundUser) {
          const { data: userList, error: fetchError } = await supabase.auth.admin.listUsers({ page, perPage });
          if (fetchError) {
            return NextResponse.json({ error: fetchError.message || 'Failed to load existing user' }, { status: 400 });
          }
          const candidates = userList?.users || [];
          foundUser = candidates.find(u => u.email?.toLowerCase() === lowerEmail);
          if (foundUser || candidates.length < perPage) break;
          page += 1;
        }
        if (!foundUser) {
          return NextResponse.json({ error: 'User already exists but could not be loaded' }, { status: 400 });
        }
        authUser = foundUser;
      } else {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 400 });
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Auth user could not be resolved' }, { status: 400 });
    }

    // Step 2: Create org/role record with only columns that exist in the live schema
    const organizationId = crypto.randomUUID();
    const roleTable = role === 'sponsor' ? 'sponsors' : role === 'investor' ? 'investors' : 'cdes';

    const rolePayload: Record<string, unknown> = {
      organization_id: organizationId,
      primary_contact_name: name,
      primary_contact_email: lowerEmail,
      organization_name: organizationName,
    };

    if (role === 'cde') {
      // Minimal required fields present in the current cdes schema
      rolePayload.total_allocation = 0;
      rolePayload.remaining_allocation = 0;
      rolePayload.min_deal_size = 0;
      rolePayload.max_deal_size = 0;
      rolePayload.small_deal_fund = false;
      rolePayload.service_area_type = 'national';
    }

    const { data: roleRow, error: roleError } = await supabase
      .from(roleTable)
      .upsert(rolePayload as never, { onConflict: 'organization_id' })
      .select('id, organization_id')
      .single();

    if (roleError || !roleRow) {
      return NextResponse.json({ error: `${role} creation failed: ${roleError?.message || 'Unknown error'}` }, { status: 400 });
    }

    // Step 3: Upsert user record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: lowerEmail,
        name,
        role: 'ORG_ADMIN',
        organization_id: organizationId,
        role_type: role,
        organization_name: organizationName,
        is_active: true,
        email_verified: true,
      } as never, { onConflict: 'id' });

    if (userError) {
      return NextResponse.json({ error: 'User record creation failed', details: userError.message }, { status: 400 });
    }

    // Step 4: Start a session so the user lands signed in
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: lowerEmail,
      password,
    });

    if (signInError || !sessionData.session) {
      return NextResponse.json({ error: signInError?.message || 'Failed to start session' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: role === 'sponsor' ? '/dashboard' : role === 'cde' ? '/dashboard/pipeline' : '/deals',
      user: {
        id: authUser.id,
        email: authUser.email,
        name,
        role: 'ORG_ADMIN',
        organizationId,
        organizationType: role,
        entityId: roleRow.id,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24,
      path: '/',
    };

    const accessToken = sessionData.session.access_token;
    const refreshToken = sessionData.session.refresh_token;

    if (accessToken) {
      response.cookies.set({ name: 'auth-token', value: accessToken, ...cookieOptions });
      response.cookies.set({ name: 'tcredex_session', value: accessToken, ...cookieOptions });
    }
    if (refreshToken) {
      response.cookies.set({ name: 'tcredex_refresh', value: refreshToken, ...cookieOptions });
    }

    // Step 5: Send emails (non-blocking, but log errors)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'https://tcredex.com';
    
    // Send verification email
    try {
      const confirmUrl = `${baseUrl}/signin?confirmed=1&email=${encodeURIComponent(lowerEmail)}`;
      const emailResult = await emailService.confirmEmail(lowerEmail, name, confirmUrl);
      if (emailResult.success) {
        console.log(`[Register] Verification email sent to ${lowerEmail}`);
      } else {
        console.error(`[Register] Failed to send verification email:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('[Register] Verification email error:', emailError);
    }
    
    // Send welcome email
    try {
      const welcomeResult = await emailService.welcome(lowerEmail, name, role as 'sponsor' | 'cde' | 'investor');
      if (welcomeResult.success) {
        console.log(`[Register] Welcome email sent to ${lowerEmail}`);
      } else {
        console.error(`[Register] Failed to send welcome email:`, welcomeResult.error);
      }
    } catch (emailError) {
      console.error('[Register] Welcome email error:', emailError);
    }

    return response;
  } catch (error) {
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
