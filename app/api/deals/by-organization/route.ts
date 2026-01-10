import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch deals for an organization
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const userEmail = searchParams.get('userEmail');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin() as any;

    // Get organization type
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', orgId)
      .single();

    if (orgError || !orgData) {
      console.error('[Deals by Org] Org not found:', orgId, orgError);
      return NextResponse.json({ deals: [] });
    }

    let query = supabase.from('deals').select('*');

    // Build conditions based on organization type
    if ((orgData as any).type === 'sponsor') {
      query = query.eq('sponsor_organization_id', orgId).neq('status', 'draft');
    } else if ((orgData as any).type === 'cde') {
      // For CDEs, find the CDE record and use its ID
      const { data: cdeData } = await supabase
        .from('cdes')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (cdeData) {
        query = query.eq('assigned_cde_id', (cdeData as any).id);
      } else {
        return NextResponse.json({ deals: [] });
      }
    } else if ((orgData as any).type === 'investor') {
      // For investors, find the investor record
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (investorData) {
        query = query.eq('assigned_investor_id', (investorData as any).id);
      } else {
        return NextResponse.json({ deals: [] });
      }
    } else {
      // Admin or unknown - return all visible deals
      query = query.eq('visible', true);
    }

    const { data: deals, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('[Deals by Org] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    return NextResponse.json({ deals: deals || [] });
  } catch (error) {
    console.error('[Deals by Org] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
