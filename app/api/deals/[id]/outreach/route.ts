/**
 * tCredex Sponsor Outreach API
 *
 * Allows Sponsors to contact CDEs and Investors about their deals.
 *
 * Business Rules:
 * - Sponsors can have max 3 active CDE requests at a time
 * - Sponsors can have max 3 active Investor requests at a time
 * - Requests expire after 7 days if no response
 * - System users get in-app messages + email
 * - Non-system users get email only (with tracking)
 * - Blacklisted organizations are excluded (e.g., US Bank)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Blacklisted organizations (never show in outreach lists)
const BLACKLISTED_ORGS = [
  'US Bank',
  'U.S. Bank',
  // Add more as needed
];

// =============================================================================
// POST /api/deals/[id]/outreach - Create outreach request
// =============================================================================
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    const body = await request.json();

    const {
      recipientIds,      // Array of CDE/Investor IDs
      recipientType,     // 'cde' | 'investor'
      message,           // Custom message from sponsor
      senderId,          // Sponsor's user ID
      senderOrgId,       // Sponsor's organization ID
      senderName,        // Sponsor's name
      senderOrg,         // Sponsor's organization name
    } = body;

    // Validate required fields
    if (!recipientIds?.length || !recipientType || !message || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify deal exists and sender owns it
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('id, project_name, sponsor_organization_id')
      .eq('id', dealId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deal = dealData as Record<string, any> | null;

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.sponsor_organization_id !== senderOrgId) {
      return NextResponse.json(
        { error: 'Only the deal owner can send outreach' },
        { status: 403 }
      );
    }

    // Check active request limits (3 per type)
    const { count: activeCount } = await supabase
      .from('outreach_requests')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .eq('sender_org_id', senderOrgId)
      .eq('recipient_type', recipientType)
      .in('status', ['pending', 'viewed']);

    if ((activeCount || 0) + recipientIds.length > 3) {
      const remaining = 3 - (activeCount || 0);
      return NextResponse.json(
        {
          error: `You can only have 3 active ${recipientType} requests at a time. You have ${remaining} slot(s) remaining.`
        },
        { status: 400 }
      );
    }

    // Create outreach requests
    const requests = recipientIds.map((recipientId: string) => ({
      deal_id: dealId,
      sender_id: senderId,
      sender_org_id: senderOrgId,
      sender_name: senderName,
      sender_org: senderOrg,
      recipient_id: recipientId,
      recipient_type: recipientType,
      message,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('outreach_requests')
      .insert(requests)
      .select();

    if (insertError) {
      console.error('Failed to create outreach requests:', insertError);
      return NextResponse.json(
        { error: 'Failed to create outreach requests' },
        { status: 500 }
      );
    }

    // TODO: Send emails via Resend
    // For system users: create in-app notification + email
    // For non-system users: email only with tracking pixel

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: senderId,
      entity_type: 'outreach',
      entity_id: dealId,
      action: 'outreach_sent',
      payload_json: {
        deal_name: deal.project_name,
        recipient_type: recipientType,
        recipient_count: recipientIds.length,
      },
      hash: generateHash({ dealId, senderId, recipientIds }),
    } as never);

    return NextResponse.json({
      success: true,
      created: inserted?.length || 0,
      message: `Sent ${inserted?.length} outreach request(s)`,
    });
  } catch (error) {
    console.error('POST /api/deals/[id]/outreach error:', error);
    return NextResponse.json(
      { error: 'Failed to send outreach' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/deals/[id]/outreach - Get available CDEs/Investors for outreach
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type'); // 'cde' | 'investor' | 'both'
    const senderOrgId = searchParams.get('senderOrgId');

    if (!senderOrgId) {
      return NextResponse.json(
        { error: 'Missing senderOrgId parameter' },
        { status: 400 }
      );
    }

    // Get deal info for matching
    const { data: deal } = await supabase
      .from('deals')
      .select('state, programs, census_tract')
      .eq('id', dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Get existing outreach requests to mark who has been contacted
    const { data: existingRequestsData } = await supabase
      .from('outreach_requests')
      .select('recipient_id, recipient_type, status')
      .eq('deal_id', dealId)
      .eq('sender_org_id', senderOrgId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingRequests = (existingRequestsData || []) as Array<{
      recipient_id: string;
      recipient_type: string;
      status: string;
    }>;

    const contactedIds = new Set(existingRequests.map(r => r.recipient_id));

    // Get active request counts
    const activeByType = {
      cde: existingRequests.filter(r =>
        r.recipient_type === 'cde' && ['pending', 'viewed'].includes(r.status)
      ).length,
      investor: existingRequests.filter(r =>
        r.recipient_type === 'investor' && ['pending', 'viewed'].includes(r.status)
      ).length,
    };

    const results: {
      cdes?: any[];
      investors?: any[];
      limits: { cde: number; investor: number };
    } = {
      limits: {
        cde: 3 - activeByType.cde,
        investor: 3 - activeByType.investor,
      },
    };

    // Fetch CDEs if requested
    if (type === 'cde' || type === 'both' || !type) {
      const { data: cdesData } = await supabase
        .from('cdes')
        .select(`
          id,
          organization_id,
          status,
          mission_statement,
          geographic_focus,
          sector_focus,
          allocation_available,
          organizations:organization_id (
            id,
            name,
            website,
            is_system_user
          )
        `)
        .eq('status', 'active');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cdes = (cdesData || []) as any[];

      results.cdes = cdes
        .filter(cde => {
          // Filter out blacklisted orgs
          const orgName = cde.organizations?.name || '';
          return !BLACKLISTED_ORGS.some(bl =>
            orgName.toLowerCase().includes(bl.toLowerCase())
          );
        })
        .map(cde => ({
          id: cde.id,
          organizationId: cde.organization_id,
          name: cde.organizations?.name || 'Unknown CDE',
          website: cde.organizations?.website,
          missionStatement: cde.mission_statement,
          geographicFocus: cde.geographic_focus || [],
          sectorFocus: cde.sector_focus || [],
          allocationAvailable: cde.allocation_available || 0,
          isSystemUser: cde.organizations?.is_system_user ?? false,
          isContacted: contactedIds.has(cde.id),
          // Calculate match score based on deal alignment
          matchScore: calculateMatchScore(deal, cde),
        }))
        .sort((a, b) => b.matchScore - a.matchScore); // Best matches first
    }

    // Fetch Investors if requested
    if (type === 'investor' || type === 'both' || !type) {
      const { data: investorsData } = await supabase
        .from('investors')
        .select(`
          id,
          organization_id,
          status,
          programs,
          geographic_focus,
          sectors,
          min_investment,
          max_investment,
          organizations:organization_id (
            id,
            name,
            website,
            is_system_user
          )
        `)
        .eq('status', 'active');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const investors = (investorsData || []) as any[];

      results.investors = investors
        .filter(inv => {
          // Filter out blacklisted orgs
          const orgName = inv.organizations?.name || '';
          return !BLACKLISTED_ORGS.some(bl =>
            orgName.toLowerCase().includes(bl.toLowerCase())
          );
        })
        .map(inv => ({
          id: inv.id,
          organizationId: inv.organization_id,
          name: inv.organizations?.name || 'Unknown Investor',
          website: inv.organizations?.website,
          programs: inv.programs || [],
          geographicFocus: inv.geographic_focus || [],
          sectors: inv.sectors || [],
          minInvestment: inv.min_investment,
          maxInvestment: inv.max_investment,
          isSystemUser: inv.organizations?.is_system_user ?? false,
          isContacted: contactedIds.has(inv.id),
          // Calculate match score based on deal alignment
          matchScore: calculateInvestorMatchScore(deal, inv),
        }))
        .sort((a, b) => b.matchScore - a.matchScore); // Best matches first
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/deals/[id]/outreach error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outreach options' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper: Calculate CDE match score
// =============================================================================
function calculateMatchScore(deal: any, cde: any): number {
  let score = 0;

  // Geographic match (0-40 points)
  const geoFocus = cde.geographic_focus || [];
  if (geoFocus.includes('ALL') || geoFocus.includes('National')) {
    score += 20;
  } else if (deal.state && geoFocus.includes(deal.state)) {
    score += 40;
  }

  // Sector match (0-30 points)
  // TODO: Add sector matching when deal has sector data

  // Has allocation available (0-30 points)
  if (cde.allocation_available > 0) {
    score += 30;
  }

  return score;
}

// =============================================================================
// Helper: Calculate Investor match score
// =============================================================================
function calculateInvestorMatchScore(deal: any, investor: any): number {
  let score = 0;

  // Program match (0-50 points)
  const dealPrograms = deal.programs || [];
  const investorPrograms = investor.programs || [];
  const hasMatchingProgram = dealPrograms.some((p: string) =>
    investorPrograms.includes(p)
  );
  if (hasMatchingProgram) {
    score += 50;
  }

  // Geographic match (0-30 points)
  const geoFocus = investor.geographic_focus || [];
  if (geoFocus.includes('ALL') || geoFocus.includes('National')) {
    score += 15;
  } else if (deal.state && geoFocus.includes(deal.state)) {
    score += 30;
  }

  // Active investor bonus (0-20 points)
  if (investor.status === 'active') {
    score += 20;
  }

  return score;
}

// =============================================================================
// Helper: Generate hash for ledger
// =============================================================================
function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
