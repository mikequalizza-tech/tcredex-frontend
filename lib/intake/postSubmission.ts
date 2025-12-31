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
// SECTION C SCORING (Simplified - uses tract data from deal)
// =============================================================================

function calculateSectionCScore(deal: Record<string, any>): {
  totalScore: number;
  tier: 'TIER_1_GREENLIGHT' | 'TIER_2_WATCHLIST' | 'TIER_3_DEFER';
  breakdown: {
    distress: number;
    impact: number;
    readiness: number;
    missionFit: number;
  };
} {
  // Extract tract data from deal
  const povertyRate = deal.tract_poverty_rate || 0;
  const severelyDistressed = deal.tract_severely_distressed || false;

  // PILLAR 1: Economic Distress (0-40 points)
  let distress = 0;
  if (povertyRate >= 40) distress += 10;
  else if (povertyRate >= 30) distress += 8;
  else if (povertyRate >= 20) distress += 6;
  else if (povertyRate >= 15) distress += 4;

  if (severelyDistressed) distress += 15;
  if (deal.tract_eligible) distress += 10;
  // Non-metro bonus
  if (deal.tract_non_metro) distress += 5;
  distress = Math.min(distress, 40);

  // PILLAR 2: Impact Potential (0-35 points)
  let impact = 0;
  const jobs = deal.jobs_created || deal.permanent_jobs_fte || 0;
  if (jobs >= 100) impact += 15;
  else if (jobs >= 50) impact += 12;
  else if (jobs >= 25) impact += 8;
  else if (jobs >= 10) impact += 5;

  // Community benefit
  if (deal.community_benefit && deal.community_benefit.length > 100) impact += 10;
  else if (deal.community_benefit) impact += 5;

  // Essential services (healthcare, education, food access)
  const essentialSectors = ['healthcare', 'education', 'grocery', 'community_facility'];
  if (essentialSectors.some(s => deal.project_type?.toLowerCase().includes(s))) {
    impact += 10;
  }
  impact = Math.min(impact, 35);

  // PILLAR 3: Project Readiness (0-15 points)
  let readiness = 0;
  if (deal.site_control === 'Owned' || deal.site_control === 'Under Contract') readiness += 5;
  else if (deal.site_control === 'Option') readiness += 3;

  if (deal.phase_i_environmental === 'Complete') readiness += 4;
  else if (deal.phase_i_environmental === 'In Progress') readiness += 2;

  if (deal.zoning_approval === 'Approved') readiness += 3;
  else if (deal.zoning_approval === 'In Progress') readiness += 2;

  if (deal.construction_start_date) readiness += 3;
  readiness = Math.min(readiness, 15);

  // PILLAR 4: Mission Fit (0-10 points)
  // This would normally compare to CDE preferences, but we'll use generic scoring
  let missionFit = 5; // Base score
  if (deal.affordable_housing_units > 0) missionFit += 3;
  if (deal.permanent_jobs_fte > 25) missionFit += 2;
  missionFit = Math.min(missionFit, 10);

  const totalScore = distress + impact + readiness + missionFit;

  // Determine tier
  let tier: 'TIER_1_GREENLIGHT' | 'TIER_2_WATCHLIST' | 'TIER_3_DEFER';
  if (distress >= 28 && impact >= 23) {
    tier = 'TIER_1_GREENLIGHT';
  } else if (totalScore >= 60) {
    tier = 'TIER_2_WATCHLIST';
  } else {
    tier = 'TIER_3_DEFER';
  }

  return {
    totalScore,
    tier,
    breakdown: {
      distress,
      impact,
      readiness,
      missionFit,
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

    // 2. Calculate Section C Score
    try {
      const scoring = calculateSectionCScore(deal);

      // Save to deal_scores table
      await supabase.from('deal_scores').upsert({
        deal_id: dealId,
        total_score: scoring.totalScore,
        distress_score: scoring.breakdown.distress,
        impact_score: scoring.breakdown.impact,
        readiness_score: scoring.breakdown.readiness,
        mission_fit_score: scoring.breakdown.missionFit,
        tier: scoring.tier,
        model_version: '1.0.0',
        calculated_at: new Date().toISOString(),
      }, { onConflict: 'deal_id' });

      // Update deal with scoring tier
      await supabase
        .from('deals')
        .update({
          scoring_tier: scoring.tier,
          section_c_score: scoring.totalScore,
        })
        .eq('id', dealId);

      result.scoring = {
        success: true,
        totalScore: scoring.totalScore,
        tier: scoring.tier,
      };

      // Log to ledger
      await supabase.from('ledger_events').insert({
        actor_type: 'system',
        actor_id: 'section_c_engine',
        entity_type: 'deal',
        entity_id: dealId,
        action: 'scoring_calculated',
        payload_json: scoring,
        hash: Date.now().toString(16),
      });

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
      });

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
