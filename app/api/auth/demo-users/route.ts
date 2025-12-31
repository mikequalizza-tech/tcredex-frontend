/**
 * tCredex API - Get Demo Users
 * GET /api/auth/demo-users
 *
 * Returns available demo users from the database for the login page.
 * Fetches from: investors, sponsors, and users tables.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface DemoUser {
  email: string;
  name: string;
  type: 'cde' | 'sponsor' | 'investor' | 'admin';
  organization?: string;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const demoUsers: DemoUser[] = [];

    // Fetch investors (limit to first few for demo)
    const { data: investors } = await supabase
      .from('investors')
      .select(`
        primary_contact_email,
        primary_contact_name,
        organization:organizations(name)
      `)
      .not('primary_contact_email', 'is', null)
      .limit(3);

    if (investors) {
      investors.forEach((inv: any) => {
        if (inv.primary_contact_email) {
          demoUsers.push({
            email: inv.primary_contact_email,
            name: inv.primary_contact_name || 'Investor',
            type: 'investor',
            organization: inv.organization?.name,
          });
        }
      });
    }

    // Fetch sponsors
    const { data: sponsors } = await supabase
      .from('sponsors')
      .select(`
        primary_contact_email,
        primary_contact_name,
        organization:organizations(name)
      `)
      .not('primary_contact_email', 'is', null)
      .limit(3);

    if (sponsors) {
      sponsors.forEach((sp: any) => {
        if (sp.primary_contact_email) {
          demoUsers.push({
            email: sp.primary_contact_email,
            name: sp.primary_contact_name || 'Sponsor',
            type: 'sponsor',
            organization: sp.organization?.name,
          });
        }
      });
    }

    // Fetch CDE users
    const { data: users } = await supabase
      .from('users')
      .select(`
        email,
        name,
        organization:organizations(name, type)
      `)
      .not('email', 'is', null)
      .limit(5);

    if (users) {
      users.forEach((u: any) => {
        if (u.email) {
          const orgType = u.organization?.type;
          demoUsers.push({
            email: u.email,
            name: u.name || 'User',
            type: orgType === 'admin' ? 'admin' : 'cde',
            organization: u.organization?.name,
          });
        }
      });
    }

    return NextResponse.json({
      users: demoUsers,
      password: 'demo123',
      adminPassword: 'admin123',
    });

  } catch (error) {
    console.error('[DemoUsers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo users', users: [] },
      { status: 500 }
    );
  }
}
