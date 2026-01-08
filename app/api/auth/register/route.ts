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

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName, role } = await request.json();

    if (!email || !password || !name || !organizationName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['sponsor', 'cde', 'investor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be sponsor, cde, or investor' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Step 1: Create auth user with email confirmed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Email confirmed on creation
      user_metadata: {
        full_name: name,
        role: role,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Step 2: Create organization (ALWAYS new with unique slug)
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: uniqueSlug,
        type: role, // org type matches role: 'sponsor', 'cde', or 'investor'
      } as never)
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error('[Register] Org creation error:', orgError);
      return NextResponse.json(
        { error: `Organization creation failed: ${orgError?.message || 'Unknown error'}` },
        { status: 400 }
      );
    }

    const typedOrg = newOrg as { id: string; name: string; type: string };

    // Step 3: Create user record in users table
    // CRITICAL: This is the source of truth for user roles and org membership
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name,
        role: 'ORG_ADMIN', // User is admin of their own org
        organization_id: typedOrg.id,
        is_active: true,
        email_verified: true,
      } as never);

    if (userError) {
      console.error('[Register] User record creation error:', userError);
      // Don't fail - auth user exists, user record can be created on first login
    }

    // Step 4: Create role-specific record
    try {
      if (role === 'sponsor') {
        const { error: sponsorError } = await supabase
          .from('sponsors')
          .insert({
            organization_id: typedOrg.id,
            primary_contact_name: name,
            primary_contact_email: email.toLowerCase(),
          } as never);
        if (sponsorError) {
          console.error('[Register] Sponsor record error:', sponsorError);
        }
      } else if (role === 'cde') {
        const { error: cdeError } = await supabase
          .from('cdes')
          .insert({
            organization_id: typedOrg.id,
            primary_contact_name: name,
            primary_contact_email: email.toLowerCase(),
            status: 'active',
          } as never);
        if (cdeError) {
          console.error('[Register] CDE record error:', cdeError);
        }
      } else if (role === 'investor') {
        const { error: investorError } = await supabase
          .from('investors')
          .insert({
            organization_id: typedOrg.id,
            primary_contact_name: name,
            primary_contact_email: email.toLowerCase(),
          } as never);
        if (investorError) {
          console.error('[Register] Investor record error:', investorError);
        }
      }
    } catch (roleError) {
      console.error('[Register] Role-specific record creation error:', roleError);
    }

    // Step 5: Send emails
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tcredex.com';
    console.log(`[Register] Sending emails to ${email} (role: ${role})`);

    try {
      const confirmUrl = `${baseUrl}/signin?confirmed=1`;
      await emailService.confirmEmail(email.toLowerCase(), name, confirmUrl);
    } catch (emailError) {
      console.error('[Register] Confirmation email error:', emailError);
    }

    try {
      await emailService.welcome(email.toLowerCase(), name, role as 'sponsor' | 'cde' | 'investor');
    } catch (emailError) {
      console.error('[Register] Welcome email error:', emailError);
    }

    // Step 6: Return success
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'ORG_ADMIN',
        organization: {
          id: typedOrg.id,
          name: typedOrg.name,
          type: typedOrg.type,
        },
      },
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
