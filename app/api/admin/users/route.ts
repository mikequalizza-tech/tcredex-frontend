/**
 * tCredex Admin API - Users Management
 * GET /api/admin/users - List all users from users_simplified, investors_simplified, sponsors_simplified
 * SIMPLIFIED: Uses *_simplified tables - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cde' | 'investor' | 'sponsor';
  status: 'active' | 'pending' | 'suspended';
  organization: string;
  organizationId?: string;
  lastActive: string;
  dealsCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const adminUsers: AdminUser[] = [];

    // Parse query params
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search')?.toLowerCase();

    // Fetch from users_simplified table (CDEs and admins)
    const { data: users, error: usersError } = await supabase
      .from('users_simplified')
      .select('id, name, email, role, organization_id, organization_type, is_active, last_login_at')
      .order('created_at', { ascending: false });

    type UserRow = {
      id: string;
      name: string | null;
      email: string;
      role: string | null;
      organization_id: string | null;
      organization_type: string | null;
      is_active: boolean;
      last_login_at: string | null;
    };
    const typedUsers = users as UserRow[] | null;

    if (!usersError && typedUsers) {
      for (const user of typedUsers) {
        // Determine role from organization_type
        const userRole = user.organization_type === 'admin' ? 'admin' : 'cde';

        // Apply filters
        if (roleFilter && roleFilter !== 'all' && roleFilter !== userRole) continue;
        if (search && !user.name?.toLowerCase().includes(search) && !user.email?.toLowerCase().includes(search)) continue;

        // Get organization name if user has org
        let orgName = 'Unknown Organization';
        if (user.organization_id && user.organization_type) {
          const tableName = user.organization_type === 'sponsor' ? 'sponsors_simplified'
            : user.organization_type === 'investor' ? 'investors_simplified'
            : 'cdes_merged';
          const { data: org } = await supabase
            .from(tableName)
            .select('name')
            .eq('organization_id', user.organization_id)
            .single();
          if (org) orgName = (org as { name: string }).name;
        }

        // Count deals for this user's organization
        let dealsCount = 0;
        if (user.organization_id) {
          const { count } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .or(`sponsor_id.eq.${user.organization_id}`);
          dealsCount = count || 0;
        }

        adminUsers.push({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: userRole as 'admin' | 'cde',
          status: user.is_active ? 'active' : 'suspended',
          organization: orgName,
          organizationId: user.organization_id || undefined,
          lastActive: user.last_login_at || new Date().toISOString(),
          dealsCount,
        });
      }
    }

    // Fetch from investors_simplified table
    if (!roleFilter || roleFilter === 'all' || roleFilter === 'investor') {
      const { data: investors, error: investorsError } = await supabase
        .from('investors_simplified')
        .select('id, name, primary_contact_name, primary_contact_email, status, organization_id, updated_at')
        .not('primary_contact_email', 'is', null)
        .order('created_at', { ascending: false });

      type InvestorRow = {
        id: string;
        name: string | null;
        primary_contact_name: string | null;
        primary_contact_email: string;
        status: string | null;
        organization_id: string | null;
        updated_at: string | null;
      };
      const typedInvestors = investors as InvestorRow[] | null;

      if (!investorsError && typedInvestors) {
        for (const inv of typedInvestors) {
          // Apply search filter
          if (search && !inv.primary_contact_name?.toLowerCase().includes(search) && !inv.primary_contact_email?.toLowerCase().includes(search)) continue;

          // Count deals for this investor
          let dealsCount = 0;
          const { count } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('investor_id', inv.id);
          dealsCount = count || 0;

          adminUsers.push({
            id: inv.id,
            name: inv.primary_contact_name || inv.name || 'Investor User',
            email: inv.primary_contact_email,
            role: 'investor',
            status: (inv.status as 'active' | 'pending' | 'suspended') || 'active',
            organization: inv.name || 'Unknown Organization',
            organizationId: inv.organization_id || undefined,
            lastActive: inv.updated_at || new Date().toISOString(),
            dealsCount,
          });
        }
      }
    }

    // Fetch from sponsors_simplified table
    if (!roleFilter || roleFilter === 'all' || roleFilter === 'sponsor') {
      const { data: sponsors, error: sponsorsError } = await supabase
        .from('sponsors_simplified')
        .select('id, name, primary_contact_name, primary_contact_email, status, organization_id, updated_at')
        .not('primary_contact_email', 'is', null)
        .order('created_at', { ascending: false });

      type SponsorRow = {
        id: string;
        name: string | null;
        primary_contact_name: string | null;
        primary_contact_email: string;
        status: string | null;
        organization_id: string | null;
        updated_at: string | null;
      };
      const typedSponsors = sponsors as SponsorRow[] | null;

      if (!sponsorsError && typedSponsors) {
        for (const sp of typedSponsors) {
          // Apply search filter
          if (search && !sp.primary_contact_name?.toLowerCase().includes(search) && !sp.primary_contact_email?.toLowerCase().includes(search)) continue;

          // Count deals for this sponsor
          let dealsCount = 0;
          if (sp.id) {
            const { count } = await supabase
              .from('deals')
              .select('*', { count: 'exact', head: true })
              .eq('sponsor_id', sp.id);
            dealsCount = count || 0;
          }

          adminUsers.push({
            id: sp.id,
            name: sp.primary_contact_name || sp.name || 'Sponsor User',
            email: sp.primary_contact_email,
            role: 'sponsor',
            status: (sp.status as 'active' | 'pending' | 'suspended') || 'active',
            organization: sp.name || 'Unknown Organization',
            organizationId: sp.organization_id || undefined,
            lastActive: sp.updated_at || new Date().toISOString(),
            dealsCount,
          });
        }
      }
    }

    return NextResponse.json({
      users: adminUsers,
      total: adminUsers.length,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Internal server error', users: [] },
      { status: 500 }
    );
  }
}
