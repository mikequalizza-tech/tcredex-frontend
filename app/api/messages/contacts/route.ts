/**
 * Contacts API
 * SIMPLIFIED: Uses *_simplified and cdes_merged tables - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch contacts based on category
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'team';
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let contacts: any[] = [];

    if (category === 'team') {
      // Fetch team members from same organization
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role')
        .eq('organization_id', organizationId);

      if (error) throw error;

      contacts = (data || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.email,
        organization: 'Your Team',
        role: user.role || 'Member',
        org_type: 'team',
      }));
    } else if (category === 'cde') {
      // Fetch CDEs
      const { data, error } = await supabaseAdmin
        .from('cdes')
        .select('id, primary_contact_name, primary_contact_email')
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((cde: any) => ({
        id: cde.id,
        name: cde.primary_contact_name || cde.primary_contact_email,
        organization: cde.primary_contact_name || 'CDE',
        role: 'CDE',
        org_type: 'cde',
      }));
    } else if (category === 'investor') {
      // Fetch Investors
      const { data, error } = await supabaseAdmin
        .from('investors')
        .select('id, primary_contact_name, primary_contact_email')
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((investor: any) => ({
        id: investor.id,
        name: investor.primary_contact_name || investor.primary_contact_email,
        organization: investor.primary_contact_name || 'Investor',
        role: 'Investor',
        org_type: 'investor',
      }));
    } else if (category === 'sponsor') {
      // Fetch Sponsors
      const { data, error } = await supabaseAdmin
        .from('sponsors')
        .select('id, primary_contact_name, primary_contact_email')
        .neq('id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((sponsor: any) => ({
        id: sponsor.id,
        name: sponsor.primary_contact_name || sponsor.primary_contact_email,
        organization: sponsor.primary_contact_name || 'Sponsor',
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
