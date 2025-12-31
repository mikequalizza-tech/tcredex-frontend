/**
 * tCredex Admin API - Users Management
 * GET /api/admin/users - List all users from users, investors, and sponsors tables
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

    // Fetch from users table (CDEs and admins)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        status,
        organization_id,
        last_login_at,
        organization:organizations(name, type)
      `)
      .order('created_at', { ascending: false });

    if (!usersError && users) {
      for (const user of users) {
        const orgType = (user.organization as any)?.type;
        const userRole = orgType === 'admin' ? 'admin' : 'cde';

        // Apply filters
        if (roleFilter && roleFilter !== 'all' && roleFilter !== userRole) continue;
        if (search && !user.name?.toLowerCase().includes(search) && !user.email?.toLowerCase().includes(search)) continue;

        // Count deals for this user's organization
        let dealsCount = 0;
        if (user.organization_id) {
          const { count } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .or(`sponsor_organization_id.eq.${user.organization_id},assigned_cde_id.eq.${user.organization_id}`);
          dealsCount = count || 0;
        }

        adminUsers.push({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: userRole as 'admin' | 'cde',
          status: (user.status as any) || 'active',
          organization: (user.organization as any)?.name || 'Unknown Organization',
          organizationId: user.organization_id,
          lastActive: user.last_login_at || new Date().toISOString(),
          dealsCount,
        });
      }
    }

    // Fetch from investors table
    if (!roleFilter || roleFilter === 'all' || roleFilter === 'investor') {
      const { data: investors, error: investorsError } = await supabase
        .from('investors')
        .select(`
          id,
          primary_contact_name,
          primary_contact_email,
          status,
          organization_id,
          updated_at,
          organization:organizations(name)
        `)
        .not('primary_contact_email', 'is', null)
        .order('created_at', { ascending: false });

      if (!investorsError && investors) {
        for (const inv of investors) {
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
            name: inv.primary_contact_name || 'Investor User',
            email: inv.primary_contact_email,
            role: 'investor',
            status: (inv.status as any) || 'active',
            organization: (inv.organization as any)?.name || 'Unknown Organization',
            organizationId: inv.organization_id,
            lastActive: inv.updated_at || new Date().toISOString(),
            dealsCount,
          });
        }
      }
    }

    // Fetch from sponsors table
    if (!roleFilter || roleFilter === 'all' || roleFilter === 'sponsor') {
      const { data: sponsors, error: sponsorsError } = await supabase
        .from('sponsors')
        .select(`
          id,
          primary_contact_name,
          primary_contact_email,
          status,
          organization_id,
          updated_at,
          organization:organizations(name)
        `)
        .not('primary_contact_email', 'is', null)
        .order('created_at', { ascending: false });

      if (!sponsorsError && sponsors) {
        for (const sp of sponsors) {
          // Apply search filter
          if (search && !sp.primary_contact_name?.toLowerCase().includes(search) && !sp.primary_contact_email?.toLowerCase().includes(search)) continue;

          // Count deals for this sponsor
          let dealsCount = 0;
          if (sp.organization_id) {
            const { count } = await supabase
              .from('deals')
              .select('*', { count: 'exact', head: true })
              .eq('sponsor_organization_id', sp.organization_id);
            dealsCount = count || 0;
          }

          adminUsers.push({
            id: sp.id,
            name: sp.primary_contact_name || 'Sponsor User',
            email: sp.primary_contact_email,
            role: 'sponsor',
            status: (sp.status as any) || 'active',
            organization: (sp.organization as any)?.name || 'Unknown Organization',
            organizationId: sp.organization_id,
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
