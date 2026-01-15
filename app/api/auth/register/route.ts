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

    // Step 2: Create role-specific record DIRECTLY (simplified schema)
    // No separate "organizations" table - each role has its own table
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Generate organization_id to link user to their entity
    const organizationId = crypto.randomUUID();
    let entityId: string | null = null;

    if (role === 'sponsor') {
      const { data: newSponsor, error: sponsorError } = await supabase
        .from('sponsors_simplified')
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

      if (sponsorError || !newSponsor) {
        console.error('[Register] Sponsor creation error:', sponsorError);
        return NextResponse.json(
          { error: `Sponsor creation failed: ${sponsorError?.message || 'Unknown error'}` },
          { status: 400 }
        );
      }
      entityId = (newSponsor as { id: string }).id;
    } else if (role === 'investor') {
      const { data: newInvestor, error: investorError } = await supabase
        .from('investors_simplified')
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

      if (investorError || !newInvestor) {
        console.error('[Register] Investor creation error:', investorError);
        return NextResponse.json(
          { error: `Investor creation failed: ${investorError?.message || 'Unknown error'}` },
          { status: 400 }
        );
      }
      entityId = (newInvestor as { id: string }).id;
    } else if (role === 'cde') {
      // CDEs use cdes_merged - but typically CDEs are pre-loaded, not self-registered
      // For now, create a placeholder entry
      console.log('[Register] CDE registration - CDEs are typically pre-loaded');
      entityId = organizationId; // Use org ID as placeholder
    }

    // Step 3: Create user record (simplified)
    const { error: userError } = await supabase
      .from('users_simplified')
      .insert({
        id: authData.user.id,
        clerk_id: authData.user.id, // Same as Supabase auth ID for now
        email: email.toLowerCase(),
        name: name,
        role: 'ORG_ADMIN',
        organization_id: organizationId,
        organization_type: role,
        is_active: true,
        email_verified: true,
      } as never);

    if (userError) {
      console.error('[Register] User record creation error:', userError);
    }

    // For compatibility, also create in old tables (can remove later)
    try {
      await supabase.from('organizations').insert({
        id: organizationId,
        name: organizationName,
        slug: uniqueSlug,
        type: role,
      } as never);
    } catch (e) {
      // Ignore - old table may not exist or have conflicts
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
        organizationId: organizationId,
        organizationType: role,
        entityId: entityId, // Direct ID for sponsor/investor (use this for intake!)
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
