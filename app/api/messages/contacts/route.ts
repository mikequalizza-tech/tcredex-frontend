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

  // Handle Clerk org IDs (start with 'org_') - user needs registration, return empty
  if (organizationId.startsWith('org_') || organizationId === 'pending') {
    return NextResponse.json({ contacts: [] });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let contacts: any[] = [];

    if (category === 'team') {
<<<<<<< HEAD
      // Fetch team members from same organization (users_simplified)
      const { data, error } = await supabase
        .from('users_simplified')
        .select('id, name, email, role, clerk_id')
=======
      // Fetch team members from same organization
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role')
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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
<<<<<<< HEAD
      // Fetch CDEs from cdes_merged
      const { data, error } = await supabase
        .from('cdes_merged')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
=======
      // Fetch CDEs
      const { data, error } = await supabaseAdmin
        .from('cdes')
        .select('id, primary_contact_name, primary_contact_email')
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((cde: any) => ({
<<<<<<< HEAD
        id: cde.organization_id || cde.id,
        name: cde.name,
        organization: cde.name,
=======
        id: cde.id,
        name: cde.primary_contact_name || cde.primary_contact_email,
        organization: cde.primary_contact_name || 'CDE',
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        role: 'CDE',
        org_type: 'cde',
      }));
    } else if (category === 'investor') {
<<<<<<< HEAD
      // Fetch Investors from investors_simplified
      const { data, error } = await supabase
        .from('investors_simplified')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
=======
      // Fetch Investors
      const { data, error } = await supabaseAdmin
        .from('investors')
        .select('id, primary_contact_name, primary_contact_email')
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        .limit(50);

      if (error) throw error;

<<<<<<< HEAD
      contacts = (data || []).map((inv: any) => ({
        id: inv.organization_id || inv.id,
        name: inv.name,
        organization: inv.name,
=======
      contacts = (data || []).map((investor: any) => ({
        id: investor.id,
        name: investor.primary_contact_name || investor.primary_contact_email,
        organization: investor.primary_contact_name || 'Investor',
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        role: 'Investor',
        org_type: 'investor',
      }));
    } else if (category === 'sponsor') {
<<<<<<< HEAD
      // Fetch Sponsors from sponsors_simplified
      const { data, error } = await supabase
        .from('sponsors_simplified')
        .select('id, organization_id, name')
        .neq('organization_id', organizationId)
=======
      // Fetch Sponsors
      const { data, error } = await supabaseAdmin
        .from('sponsors')
        .select('id, primary_contact_name, primary_contact_email')
        .neq('id', organizationId)
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
        .limit(50);

      if (error) throw error;

<<<<<<< HEAD
      contacts = (data || []).map((sp: any) => ({
        id: sp.organization_id || sp.id,
        name: sp.name,
        organization: sp.name,
=======
      contacts = (data || []).map((sponsor: any) => ({
        id: sponsor.id,
        name: sponsor.primary_contact_name || sponsor.primary_contact_email,
        organization: sponsor.primary_contact_name || 'Sponsor',
>>>>>>> 6fd0f1a (Refactors authentication to Supabase Auth)
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
