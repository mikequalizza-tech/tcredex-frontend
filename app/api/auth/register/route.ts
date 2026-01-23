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
    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role },
    });
    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 });
    }
    // Step 2: Create org/role record
    const baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 80);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    let organizationId = null;
    let entityId = null;
    if (role === 'sponsor' || role === 'investor') {
      organizationId = crypto.randomUUID();
      const table = role === 'sponsor' ? 'sponsors' : 'investors_simplified';
      const { data: orgData, error: orgError } = await supabase
        .from(table)
        .insert({
          organization_id: organizationId,
          name: organizationName,
          slug: uniqueSlug,
          primary_contact_name: name,
          primary_contact_email: email.toLowerCase(),
          status: 'active',
        } as never)
        .select('id')
        .single();
      if (orgError || !orgData) {
        return NextResponse.json({ error: `${role} creation failed: ${orgError?.message || 'Unknown error'}` }, { status: 400 });
      }
      entityId = orgData.id;
    } else if (role === 'cde') {
      // CDEs are typically pre-loaded, but allow placeholder
      organizationId = crypto.randomUUID();
      entityId = organizationId;
    }
    // Step 3: Create user record
    const { error: userError } = await supabase
      .from('users_simplified')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name,
        role: 'ORG_ADMIN',
        organization_id: organizationId,
        organization_type: role,
        is_active: true,
        email_verified: true,
      } as never);
    if (userError) {
      return NextResponse.json({ error: 'User record creation failed', details: userError.message }, { status: 400 });
    }
    // Step 4: (Optional) Create legacy org record for compatibility
    try {
      await supabase.from('organizations').insert({
        id: organizationId,
        name: organizationName,
        slug: uniqueSlug,
        type: role,
      } as never);
    } catch (e) {}
    // Step 5: Send emails (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tcredex.com';
    try {
      const confirmUrl = `${baseUrl}/signin?confirmed=1`;
      await emailService.confirmEmail(email.toLowerCase(), name, confirmUrl);
    } catch (emailError) {}
    try {
      await emailService.welcome(email.toLowerCase(), name, role as 'sponsor' | 'cde' | 'investor');
    } catch (emailError) {}
    // Step 6: Return success
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'ORG_ADMIN',
        organizationId,
        organizationType: role,
        entityId,
      },
    });
  } catch (error) {
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
