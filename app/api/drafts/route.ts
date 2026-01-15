/**
 * Drafts API (deals-backed)
 * Stores drafts on the deals table using status='draft' and draft_data
 *
 * SIMPLIFIED: Uses sponsors_simplified table
 * With new schema, sponsor.id is passed directly from registration (entityId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Resolve sponsor_id from organization_id (create sponsor row if missing)
// NOTE: With simplified schema, this should rarely be needed - entityId from registration is the sponsor.id
async function resolveSponsorId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  fallbackName?: string,
  fallbackEmail?: string
) {
  // First try sponsors_simplified
  const { data: sponsorRow } = await supabase
    .from('sponsors_simplified')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if ((sponsorRow as any)?.id) return (sponsorRow as any).id as string;

  // Create new sponsor if not found
  const baseSlug = (fallbackName || 'sponsor')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: newSponsor, error: sponsorInsertError } = await supabase
    .from('sponsors_simplified')
    .insert({
      organization_id: organizationId,
      name: fallbackName || 'Sponsor',
      slug: uniqueSlug,
      primary_contact_name: fallbackName || 'Sponsor',
      primary_contact_email: fallbackEmail,
      status: 'active',
    } as never)
    .select('id')
    .single();

  if (sponsorInsertError || !(newSponsor as any)?.id) {
    console.error('[Drafts] Sponsor creation error:', sponsorInsertError);
    throw new Error('Unable to resolve sponsor record');
  }

  return (newSponsor as any).id as string;
}

// GET - Load latest draft for organization or specific deal id
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const orgId = searchParams.get('orgId');
  const sponsorId = searchParams.get('sponsorId'); // New: direct sponsor ID

  if (!id && !orgId && !sponsorId) {
    return NextResponse.json(
      { error: 'sponsorId, orgId, or deal id required' },
      { status: 400 }
    );
  }

  try {
    if (id) {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      return NextResponse.json({ draft: data });
    }

    // Query by sponsor_id directly (simplified) or fall back to organization lookup
    let query = supabase
      .from('deals')
      .select('*')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (sponsorId) {
      query = query.eq('sponsor_id', sponsorId);
    } else if (orgId) {
      // Legacy: look up sponsor by organization_id first
      const resolvedSponsorId = await resolveSponsorId(supabase, orgId);
      query = query.eq('sponsor_id', resolvedSponsorId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Drafts] Load error:', error);
      return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
    }

    return NextResponse.json({ draft: data || null });
  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Save/update draft on deals
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { organizationId, sponsorId: directSponsorId, data, readinessScore, dealId } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    // Use direct sponsorId if provided (new simplified flow), otherwise resolve from org
    let sponsorId = directSponsorId || data.sponsorId;
    if (!sponsorId && organizationId) {
      sponsorId = await resolveSponsorId(
        supabase,
        organizationId,
        data.sponsorName || data.personCompletingForm,
        data.personCompletingForm || data.contactEmail
      );
    }

    if (!sponsorId) {
      return NextResponse.json(
        { error: 'sponsorId or organizationId required' },
        { status: 400 }
      );
    }

    const readiness = readinessScore || 0;
    const projectName = data.projectName || 'Untitled Project';

    const baseRecord = {
      project_name: projectName,
      sponsor_id: sponsorId,
      sponsor_name: data.sponsorName,
      programs: data.programs || ['NMTC'],
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      census_tract: data.censusTract,
      latitude: data.latitude,
      longitude: data.longitude,
      tract_eligible: data.tractEligible,
      tract_severely_distressed: data.tractSeverelyDistressed,
      tract_poverty_rate: data.tractPovertyRate,
      tract_median_income: data.tractMedianIncome,
      tract_unemployment: data.tractUnemployment,
      project_type: data.projectType,
      venture_type: data.ventureType,
      project_description: data.projectDescription,
      total_project_cost: data.totalProjectCost,
      nmtc_financing_requested: data.nmtcFinancingRequested,
      financing_gap: data.financingGap,
      jobs_created: data.jobsCreated || data.permanentJobsFTE,
      jobs_retained: data.jobsRetained,
      permanent_jobs_fte: data.permanentJobsFTE,
      construction_jobs_fte: data.constructionJobsFTE,
      community_benefit: data.communityBenefit || data.communityImpact,
      intake_data: data,
      draft_data: data,
      readiness_score: readiness,
      status: 'draft',
      visible: false,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    let targetId = dealId as string | null;

    if (!targetId) {
      // Find existing draft by sponsor_id
      const { data: existingDraft } = await supabase
        .from('deals')
        .select('id')
        .eq('sponsor_id', sponsorId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      targetId = (existingDraft as { id: string } | null)?.id || null;
    }

    let result;
    if (targetId) {
      result = await supabase
        .from('deals')
        .update(baseRecord as never)
        .eq('id', targetId)
        .select('*')
        .single();
    } else {
      result = await supabase
        .from('deals')
        .insert({
          ...baseRecord,
          status: 'draft',
          tier: 1,
        } as never)
        .select('*')
        .single();
    }

    if (result.error) {
      console.error('[Drafts] Save error:', result.error);
      return NextResponse.json({
        error: 'Failed to save draft',
        details: result.error.message,
        code: result.error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      draft: result.data,
      message: targetId ? 'Draft updated' : 'Draft created'
    });

  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete draft (draft-status deals) by id or sponsor
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const sponsorId = searchParams.get('sponsorId');
  const orgId = searchParams.get('orgId'); // Legacy support

  if (!id && !sponsorId && !orgId) {
    return NextResponse.json(
      { error: 'Draft id, sponsorId, or orgId required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase.from('deals').delete().eq('status', 'draft');

    if (id) {
      query = query.eq('id', id);
    } else if (sponsorId) {
      query = query.eq('sponsor_id', sponsorId);
    } else if (orgId) {
      // Legacy: resolve sponsor from org
      const resolvedSponsorId = await resolveSponsorId(supabase, orgId);
      query = query.eq('sponsor_id', resolvedSponsorId);
    }

    const { error } = await query;

    if (error) {
      console.error('[Drafts] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Draft deleted' });

  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
