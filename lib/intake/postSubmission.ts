/**
 * tCredex Post-Submission Processing
 *
 * Orchestrates the workflow after a deal is submitted:
 * 1. Calculate Section C Score (distress, impact, readiness, mission fit)
 * 2. Find CDE matches using AutoMatch engine
 * 3. Send notifications to matched CDEs
 * 4. Log all events to ledger
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { findMatches } from '@/lib/automatch/engine';
import { calculateDealScore, DealScore } from '@/lib/scoring/sectionC';
import { ScoringInput, ProjectSector, SiteControlStatus } from '@/types/scoring';

const supabase = getSupabaseAdmin();

// =============================================================================
// TYPES
// =============================================================================

export interface PostSubmissionResult {
  dealId: string;
  scoring: {
    success: boolean;
    totalScore?: number;
    tier?: string;
    error?: string;
  };
  matching: {
    success: boolean;
    matchCount?: number;
    topMatch?: {
      cdeName: string;
      score: number;
      strength: string;
    };
    error?: string;
  };
  notifications: {
    sent: number;
    failed: number;
  };
}

export interface TractData {
  poverty_rate: number;
  median_family_income: number;
  state_mfi: number;
  unemployment_rate: number;
  is_persistent_poverty_county: boolean;
  is_non_metro: boolean;
  is_capital_desert: boolean;
}

// =============================================================================
// TRANSFORM DEAL DATA TO SCORING INPUT
// =============================================================================

function transformDealToScoringInput(deal: Record<string, any>): ScoringInput {
  // Map project type to sector
  const projectType = (deal.project_type || '').toLowerCase();
  let sector: ProjectSector = 'other';
  if (projectType.includes('health') || projectType.includes('medical')) sector = 'healthcare';
  else if (projectType.includes('education') || projectType.includes('school')) sector = 'education';
  else if (projectType.includes('childcare') || projectType.includes('daycare')) sector = 'childcare';
  else if (projectType.includes('grocery') || projectType.includes('food')) sector = 'food_access';
  else if (projectType.includes('community') || projectType.includes('facility')) sector = 'community_facility';
  else if (projectType.includes('manufacturing')) sector = 'manufacturing';
  else if (projectType.includes('mixed')) sector = 'mixed_use';
  else if (projectType.includes('housing') || projectType.includes('residential')) sector = 'housing';
  else if (projectType.includes('retail')) sector = 'retail';
  else if (projectType.includes('hotel') || projectType.includes('hospitality')) sector = 'hospitality';
  else if (projectType.includes('office')) sector = 'office';

  // Map site control
  const siteControlStr = (deal.site_control || '').toLowerCase();
  let siteControl: SiteControlStatus = 'none';
  if (siteControlStr.includes('owned') || siteControlStr === 'owned') siteControl = 'owned';
  else if (siteControlStr.includes('contract') || siteControlStr === 'under contract') siteControl = 'under_contract';
  else if (siteControlStr.includes('option') || siteControlStr.includes('loi')) siteControl = 'option_loi';
  else if (siteControlStr.includes('identified') || siteControlStr.includes('selected')) siteControl = 'identified';

  // Calculate leverage ratio
  const nmtcRequest = Number(deal.nmtc_financing_requested) || Number(deal.fed_nmtc_allocation_request) || 0;
  const totalCost = Number(deal.total_project_cost) || 0;
  const leverageRatio = nmtcRequest > 0 ? (totalCost - nmtcRequest) / nmtcRequest : 0;

  // Determine catalytic potential
  const jobs = Number(deal.jobs_created) || Number(deal.permanent_jobs_fte) || 0;
  const catalyticPotential: 'high' | 'medium' | 'low' = 
    jobs >= 50 ? 'high' : jobs >= 25 ? 'medium' : 'low';

  return {
    deal_id: deal.id,
    tract: {
      geoid: deal.census_tract || '',
      poverty_rate: Number(deal.tract_poverty_rate) || Number(deal.poverty_rate) || 0,
      median_family_income: Number(deal.tract_median_income) || Number(deal.median_income) || 50000,
      unemployment_rate: Number(deal.tract_unemployment) || Number(deal.unemployment_rate) || 0,
      state_mfi: Number(deal.state_mfi) || 50000,
      is_lic_eligible: deal.tract_eligible || false,
      is_severely_distressed: deal.tract_severely_distressed || false,
      is_qct: deal.tract_eligible || false,
      is_opportunity_zone: deal.opportunity_zone || false,
      is_persistent_poverty_county: deal.is_persistent_poverty_county || false,
      is_non_metro: deal.is_non_metro || deal.tract_non_metro || false,
      is_high_migration: deal.is_high_migration || false,
      is_tribal_area: deal.is_tribal_area || false,
      is_rcap: deal.is_rcap || false,
      is_acp: deal.is_acp || false,
      is_high_opportunity_area: deal.is_high_opportunity_area || false,
    },
    project: {
      sector,
      state: deal.state || '',
      county: deal.county || undefined,
      total_project_cost: totalCost,
      nmtc_request: nmtcRequest,
      permanent_jobs: Number(deal.permanent_jobs_fte) || Number(deal.jobs_created) || 0,
      construction_jobs: Number(deal.construction_jobs_fte) || undefined,
      serves_lmi_directly: deal.serves_lmi_directly || deal.affordable_housing_units > 0 || false,
      employs_lmi_residents: deal.employs_lmi_residents || false,
      has_local_support: deal.has_local_support || deal.community_benefit ? true : false,
      leverage_ratio: leverageRatio,
      catalytic_potential: catalyticPotential,
    },
    readiness: {
      site_control: siteControl,
      has_pro_forma: !!deal.pro_forma || !!deal.has_pro_forma,
      pro_forma_complete: deal.pro_forma_complete || false,
      has_appraisal: deal.has_appraisal || deal.appraisal_complete || false,
      has_phase_i: deal.phase_i_environmental === 'Complete' || deal.has_phase_i || false,
      has_market_study: deal.has_market_study || deal.market_study_complete || false,
      committed_sources_pct: Number(deal.committed_sources_pct) || Number(deal.committed_capital_pct) || 0,
      timeline_feasible: !!deal.projected_completion_date || !!deal.projected_closing_date || false,
    },
  };
}

// =============================================================================
// MAIN ORCHESTRATION FUNCTION
// =============================================================================

export async function processPostSubmission(dealId: string): Promise<PostSubmissionResult> {
  const result: PostSubmissionResult = {
    dealId,
    scoring: { success: false },
    matching: { success: false },
    notifications: { sent: 0, failed: 0 },
  };

  try {
    // 1. Fetch the deal
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (fetchError || !deal) {
      throw new Error('Deal not found');
    }

    // 2. Calculate Section C Score using the full 4-pillar engine
    try {
      // Transform deal data to ScoringInput format
      const scoringInput = transformDealToScoringInput(deal);
      
      // Calculate score using the proper Section C engine
      const score: DealScore = calculateDealScore(scoringInput);

      // Save to deal_scores table
      await supabase.from('deal_scores').upsert({
        deal_id: dealId,
        total_score: score.total_score,
        tier: score.tier,
        distress_total: score.distress.total,
        distress_breakdown: score.distress.breakdown,
        distress_percentile: score.distress.percentile,
        impact_total: score.impact.total,
        impact_breakdown: score.impact.breakdown,
        impact_percentile: score.impact.percentile,
        readiness_total: score.readiness.total,
        readiness_breakdown: score.readiness.breakdown,
        readiness_percentile: score.readiness.percentile,
        mission_fit_total: score.mission_fit.total,
        mission_fit_breakdown: score.mission_fit.breakdown,
        mission_fit_cde_id: score.mission_fit.cde_id,
        eligibility_flags: score.eligibility_flags,
        reason_codes: score.reason_codes,
        score_explanation: score.score_explanation,
        model_version: score.model_version,
        input_snapshot: score.input_snapshot,
        computed_at: score.computed_at,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: 'deal_id' });

      // Update deal with scoring tier and total score
      await supabase
        .from('deals')
        .update({
          scoring_tier: score.tier,
          section_c_score: score.total_score,
        } as never)
        .eq('id', dealId);

      result.scoring = {
        success: true,
        totalScore: score.total_score,
        tier: score.tier,
      };

      // Log to ledger
      await supabase.from('ledger_events').insert({
        actor_type: 'system',
        actor_id: 'section_c_engine',
        entity_type: 'deal',
        entity_id: dealId,
        action: 'scoring_calculated',
        payload_json: {
          total_score: score.total_score,
          tier: score.tier,
          distress: score.distress.total,
          impact: score.impact.total,
          readiness: score.readiness.total,
          mission_fit: score.mission_fit.total,
          model_version: score.model_version,
        },
        hash: Date.now().toString(16),
      } as never);

    } catch (scoringError) {
      console.error('Section C Scoring failed:', scoringError);
      result.scoring.error = scoringError instanceof Error ? scoringError.message : 'Scoring failed';
    }

    // 3. Run AutoMatch to find CDE matches
    try {
      const matchResult = await findMatches(dealId, {
        minScore: 40,
        maxResults: 5,
        notifyMatches: true,
      });

      result.matching = {
        success: true,
        matchCount: matchResult.matches.length,
        topMatch: matchResult.matches[0] ? {
          cdeName: matchResult.matches[0].cdeName,
          score: matchResult.matches[0].totalScore,
          strength: matchResult.matches[0].matchStrength,
        } : undefined,
      };

      // Count notifications (already sent by findMatches if notifyMatches=true)
      result.notifications.sent = matchResult.matches.filter(
        m => m.matchStrength === 'excellent' || m.matchStrength === 'good'
      ).length;

      // Log to ledger
      await supabase.from('ledger_events').insert({
        actor_type: 'system',
        actor_id: 'automatch_engine',
        entity_type: 'deal',
        entity_id: dealId,
        action: 'matches_found',
        payload_json: {
          match_count: matchResult.matches.length,
          top_matches: matchResult.matches.slice(0, 3).map(m => ({
            cde: m.cdeName,
            score: m.totalScore,
            strength: m.matchStrength,
          })),
        },
        hash: Date.now().toString(16),
      } as never);

    } catch (matchError) {
      console.error('AutoMatch failed:', matchError);
      result.matching.error = matchError instanceof Error ? matchError.message : 'Matching failed';
    }

  } catch (error) {
    console.error('Post-submission processing failed:', error);
  }

  return result;
}

// =============================================================================
// HELPER: Run processing for multiple deals (batch)
// =============================================================================

export async function processPostSubmissionBatch(dealIds: string[]): Promise<PostSubmissionResult[]> {
  const results: PostSubmissionResult[] = [];

  for (const dealId of dealIds) {
    const result = await processPostSubmission(dealId);
    results.push(result);
  }

  return results;
}
