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

  try {
    const supabase = getSupabaseAdmin();
    let contacts: any[] = [];

    if (category === 'team') {
      // Fetch team members from same organization
      const { data, error } = await supabase
        .from('users')
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
      // Fetch CDEs
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'cde')
        .neq('id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        organization: org.name,
        role: 'CDE',
        org_type: 'cde',
      }));
    } else if (category === 'investor') {
      // Fetch Investors
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'investor')
        .neq('id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        organization: org.name,
        role: 'Investor',
        org_type: 'investor',
      }));
    } else if (category === 'sponsor') {
      // Fetch Sponsors
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'sponsor')
        .neq('id', organizationId)
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        organization: org.name,
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
