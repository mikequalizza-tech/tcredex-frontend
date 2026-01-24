/**
 * tCredex API - Demo Login
 * POST /api/auth/demo-login
 *
 * SIMPLIFIED: Uses simplified schema tables (sponsors, investors, users, cdes_merged) - no organization FK joins
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
    // Try to find user in each simplified table by email
    // ===================================================================

    // 1. Check investors table
    const { data: investorData } = await supabase
      .from('investors')
      .select('id, name, primary_contact_name, primary_contact_email, organization_id, slug')
      .eq('primary_contact_email', normalizedEmail)
      .single();

    type InvestorData = {
      id: string;
      name: string | null;
      primary_contact_name: string | null;
      primary_contact_email: string;
      organization_id: string | null;
      slug: string | null;
    };
    const investor = investorData as InvestorData | null;

    if (investor) {
      return NextResponse.json({
        success: true,
        user: {
          id: investor.id,
          email: normalizedEmail,
          name: investor.primary_contact_name || investor.name || 'Investor User',
          role: 'ORG_ADMIN',
          organizationId: investor.organization_id,
          organizationType: 'investor',
          organization: {
            id: investor.organization_id,
            name: investor.name,
            slug: investor.slug,
            type: 'investor',
          },
          userType: 'investor',
        },
      });
    }

    // 2. Check sponsors table
    const { data: sponsorData } = await supabase
      .from('sponsors')
      .select('id, name, primary_contact_name, primary_contact_email, organization_id, slug')
      .eq('primary_contact_email', normalizedEmail)
      .single();

    type SponsorData = {
      id: string;
      name: string | null;
      primary_contact_name: string | null;
      primary_contact_email: string;
      organization_id: string | null;
      slug: string | null;
    };
    const sponsor = sponsorData as SponsorData | null;

    if (sponsor) {
      return NextResponse.json({
        success: true,
        user: {
          id: sponsor.id,
          email: normalizedEmail,
          name: sponsor.primary_contact_name || sponsor.name || 'Sponsor User',
          role: 'ORG_ADMIN',
          organizationId: sponsor.organization_id,
          organizationType: 'sponsor',
          organization: {
            id: sponsor.organization_id,
            name: sponsor.name,
            slug: sponsor.slug,
            type: 'sponsor',
          },
          userType: 'sponsor',
        },
      });
    }

    // 3. Check users table (for CDEs and admins)
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, role, organization_id, organization_type')
      .eq('email', normalizedEmail)
      .single();

    type UserData = {
      id: string;
      email: string;
      name: string | null;
      role: string | null;
      organization_id: string | null;
      organization_type: string | null;
    };
    const user = userData as UserData | null;

    if (user) {
      // Get org details from appropriate table
      let orgName = null;
      let orgSlug = null;
      if (user.organization_id && user.organization_type) {
        const tableName = user.organization_type === 'sponsor' ? 'sponsors'
          : user.organization_type === 'investor' ? 'investors'
          : 'cdes_merged';
        const { data: org } = await supabase
          .from(tableName)
          .select('name, slug')
          .eq('organization_id', user.organization_id)
          .single();
        if (org) {
          orgName = (org as { name: string; slug: string }).name;
          orgSlug = (org as { name: string; slug: string }).slug;
        }
      }

      const orgType = user.organization_type || 'cde';
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'ORG_ADMIN',
          organizationId: user.organization_id,
          organizationType: orgType,
          organization: user.organization_id ? {
            id: user.organization_id,
            name: orgName,
            slug: orgSlug,
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
