/**
 * Contacts API
 * SIMPLIFIED: Uses *_simplified and cdes_merged tables - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch contacts based on category
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'team';
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  // Handle Clerk org IDs (start with 'org_') - user needs registration, return empty
  if (organizationId.startsWith('org_') || organizationId === 'pending') {
    return NextResponse.json({ contacts: [] });
  }

  try {
    const supabase = getSupabaseAdmin();
    let contacts: any[] = [];

    if (category === 'team') {
      // Fetch team members from same organization (users_simplified)
      const { data, error } = await supabase
        .from('users_simplified')
        .select('id, name, email, role, clerk_id')
        .eq('organization_id', organizationId);

      if (error) throw error;

      contacts = (data || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.email,
        organization: 'Your Team',
        role: user.role || 'Member',
        org_type: 'team',
        clerkId: user.clerk_id,
      }));
    } else if (category === 'cde') {
      // Fetch CDEs from cdes_merged
      const { data, error } = await supabase
        .from('cdes_merged')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((cde: any) => ({
        id: cde.organization_id || cde.id,
        name: cde.name,
        organization: cde.name,
        role: 'CDE',
        org_type: 'cde',
      }));
    } else if (category === 'investor') {
      // Fetch Investors from investors_simplified
      const { data, error } = await supabase
        .from('investors_simplified')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((inv: any) => ({
        id: inv.organization_id || inv.id,
        name: inv.name,
        organization: inv.name,
        role: 'Investor',
        org_type: 'investor',
      }));
    } else if (category === 'sponsor') {
      // Fetch Sponsors from sponsors_simplified
      const { data, error } = await supabase
        .from('sponsors_simplified')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((sp: any) => ({
        id: sp.organization_id || sp.id,
        name: sp.name,
        organization: sp.name,
        role: 'Sponsor',
        org_type: 'sponsor',
      }));
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('[Contacts] Error fetching:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
