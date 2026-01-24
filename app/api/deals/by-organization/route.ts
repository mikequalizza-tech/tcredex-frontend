/**
 * Deals by Organization API
 * SIMPLIFIED: Uses *_simplified and cdes_merged tables - no organization FK joins
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch deals for an organization
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const orgType = searchParams.get('orgType'); // New: can pass org type directly

  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // If orgType is provided, use it directly. Otherwise, try to determine from entity tables.
    let organizationType = orgType;

    if (!organizationType) {
      // Try to find organization type by checking each simplified table
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (sponsor) {
        organizationType = 'sponsor';
      } else {
        const { data: cde } = await supabase
          .from('cdes_merged')
          .select('id')
          .eq('organization_id', orgId)
          .single();

        if (cde) {
          organizationType = 'cde';
        } else {
          const { data: investor } = await supabase
            .from('investors')
            .select('id')
            .eq('organization_id', orgId)
            .single();

          if (investor) {
            organizationType = 'investor';
          }
        }
      }
    }

    let query = supabase.from('deals').select('*');

    // Build conditions based on organization type
    if (organizationType === 'sponsor') {
      // For sponsors, look up sponsor_id from sponsors
      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (sponsorData) {
        query = query.eq('sponsor_id', (sponsorData as { id: string }).id).neq('status', 'draft');
      } else {
        return NextResponse.json({ deals: [] });
      }
    } else if (organizationType === 'cde') {
      // For CDEs, find the CDE record and use its ID
      const { data: cdeData } = await supabase
        .from('cdes_merged')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (cdeData) {
        query = query.eq('assigned_cde_id', (cdeData as { id: string }).id);
      } else {
        return NextResponse.json({ deals: [] });
      }
    } else if (organizationType === 'investor') {
      // For investors, find the investor record
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (investorData) {
        query = query.eq('assigned_investor_id', (investorData as { id: string }).id);
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
