/**
 * tCredex API - Demo Login
 * POST /api/auth/demo-login
 *
 * Authenticates demo users from Supabase tables:
 * - investors table for investor users
 * - sponsors table for sponsor users
 * - users table for CDE and admin users
 *
 * Password: "demo123" for all demo accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const DEMO_PASSWORD = 'demo123';
const ADMIN_PASSWORD = 'admin123';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Check password (demo users have fixed passwords)
    const isAdminEmail = normalizedEmail.includes('@tcredex.com');
    const expectedPassword = isAdminEmail ? ADMIN_PASSWORD : DEMO_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ===================================================================
    // Try to find user in each table by email
    // ===================================================================

    // 1. Check investors table
    const { data: investorData } = await supabase
      .from('investors')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('primary_contact_email', normalizedEmail)
      .single();

    type OrgData = { id: string; name: string; slug: string; type: string };
    type InvestorData = {
      id: string;
      primary_contact_name: string | null;
      organization_id: string | null;
      organization: OrgData | null;
    };
    const investor = investorData as InvestorData | null;

    if (investor) {
      return NextResponse.json({
        success: true,
        user: {
          id: investor.id,
          email: normalizedEmail,
          name: investor.primary_contact_name || 'Investor User',
          role: 'ORG_ADMIN',
          organizationId: investor.organization_id,
          organization: investor.organization ? {
            id: investor.organization.id,
            name: investor.organization.name,
            slug: investor.organization.slug,
            type: 'investor',
          } : null,
          userType: 'investor',
        },
      });
    }

    // 2. Check sponsors table
    const { data: sponsorData } = await supabase
      .from('sponsors')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('primary_contact_email', normalizedEmail)
      .single();

    type SponsorData = {
      id: string;
      primary_contact_name: string | null;
      organization_id: string | null;
      organization: OrgData | null;
    };
    const sponsor = sponsorData as SponsorData | null;

    if (sponsor) {
      return NextResponse.json({
        success: true,
        user: {
          id: sponsor.id,
          email: normalizedEmail,
          name: sponsor.primary_contact_name || 'Sponsor User',
          role: 'ORG_ADMIN',
          organizationId: sponsor.organization_id,
          organization: sponsor.organization ? {
            id: sponsor.organization.id,
            name: sponsor.organization.name,
            slug: sponsor.organization.slug,
            type: 'sponsor',
          } : null,
          userType: 'sponsor',
        },
      });
    }

    // 3. Check users table (for CDEs and admins)
    const { data: userData } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('email', normalizedEmail)
      .single();

    type UserData = {
      id: string;
      email: string;
      name: string | null;
      role: string | null;
      organization_id: string | null;
      organization: OrgData | null;
    };
    const user = userData as UserData | null;

    if (user) {
      const orgType = user.organization?.type || 'cde';
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'ORG_ADMIN',
          organizationId: user.organization_id,
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            type: orgType,
          } : null,
          userType: orgType === 'admin' ? 'admin' : 'cde',
        },
      });
    }

    // User not found in any table
    return NextResponse.json(
      { error: 'No demo user found with this email' },
      { status: 404 }
    );

  } catch (error) {
    console.error('[DemoLogin] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
