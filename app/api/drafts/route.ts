/**
 * Drafts API (deals-backed)
 * Stores drafts on the deals table using status='draft' and draft_data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Resolve sponsor_id from organization_id (create sponsor row if missing)
async function resolveSponsorId(supabase: ReturnType<typeof getSupabaseAdmin>, organizationId: string, fallbackName?: string, fallbackEmail?: string) {
  const { data: sponsorRow } = await supabase
    .from('sponsors')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if ((sponsorRow as any)?.id) return (sponsorRow as any).id as string;

  const { data: newSponsor, error: sponsorInsertError } = await supabase
    .from('sponsors')
    .insert({
      organization_id: organizationId,
      primary_contact_name: fallbackName || 'Sponsor',
      primary_contact_email: fallbackEmail,
      status: 'active',
    } as never)
    .select('id')
    .single();

  if (sponsorInsertError || !(newSponsor as any)?.id) {
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

  if (!id && !orgId) {
    return NextResponse.json(
      { error: 'orgId or deal id required' },
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

    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('sponsor_organization_id', orgId!)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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
    const { organizationId, data, readinessScore, dealId } = body;

    if (!organizationId || !data) {
      return NextResponse.json(
        { error: 'organizationId and data are required' },
        { status: 400 }
      );
    }

    // Resolve sponsor_id
    const sponsorId = await resolveSponsorId(
      supabase,
      organizationId,
      data.sponsorName || data.personCompletingForm,
      data.personCompletingForm || data.contactEmail
    );

    const readiness = readinessScore || 0;
    const projectName = data.projectName || 'Untitled Project';

    const baseRecord = {
      project_name: projectName,
      sponsor_id: sponsorId,
      sponsor_name: data.sponsorName,
      sponsor_organization_id: organizationId,
      programs: data.programs || ['NMTC'],
      program_level: data.programLevel || 'federal',
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
      const { data: existingDraft } = await supabase
        .from('deals')
        .select('id')
        .eq('sponsor_organization_id', organizationId)
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
      console.error('[Drafts] Error details:', {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint
      });
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
    console.error('[Drafts] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE - Delete draft (draft-status deals) by id or organization
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const orgId = searchParams.get('orgId');

  if (!id && !orgId) {
    return NextResponse.json(
      { error: 'Draft id or orgId required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase.from('deals').delete().eq('status', 'draft');

    if (id) {
      query = query.eq('id', id);
    } else if (orgId) {
      query = query.eq('sponsor_organization_id', orgId!);
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
