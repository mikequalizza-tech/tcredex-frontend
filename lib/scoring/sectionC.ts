/**
 * tCredex Section C Scoring Engine
 * 
 * Canonical Source: docs/chatgpt-generated/SECTION_C_SCORING_ENGINE_FRAMEWORK.md
 * 
 * 4-Pillar Model:
 * - Economic Distress: 0-40 points (40%)
 * - Impact Potential: 0-35 points (35%)
 * - Project Readiness: 0-15 points (15%)
 * - Mission Fit: 0-10 points (10%)
 * 
 * FORBIDDEN VARIABLES (Section C Mandate):
 * - Race, gender, DEI factors
 * - Identity status
 * - Narrative/political scoring
 */

import {
  ScoringInput,
  DealScore,
  ScoreTier,
  EconomicDistressScore,
  ImpactPotentialScore,
  ProjectReadinessScore,
  MissionFitScore,
  CDECriteria,
  ProjectSector,
  TIER_THRESHOLDS,
  ESSENTIAL_SERVICE_SCORES,
  SITE_CONTROL_SCORES,
  COMMITMENT_SCORES,
  SiteControlStatus,
  CommitmentLevel,
} from '@/types/scoring';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MODEL_VERSION = '1.0.0';

// Pillar maximums
const MAX_DISTRESS = 40;
const MAX_IMPACT = 35;
const MAX_READINESS = 15;
const MAX_MISSION_FIT = 10;
const MAX_TOTAL = 100;

// =============================================================================
// PILLAR 1: ECONOMIC DISTRESS (0-40 points)
// =============================================================================

export function calculateEconomicDistress(input: ScoringInput): EconomicDistressScore {
  const tract = input.tract;
  const breakdown = {
    poverty_rate: 0,
    mfi: 0,
    unemployment: 0,
    ppc_flag: 0,
    non_metro_flag: 0,
    capital_desert: 0,
  };

  // Poverty Rate (0-10 points)
  // Higher poverty = more distressed = higher score
  if (tract.poverty_rate >= 40) breakdown.poverty_rate = 10;
  else if (tract.poverty_rate >= 30) breakdown.poverty_rate = 8;
  else if (tract.poverty_rate >= 25) breakdown.poverty_rate = 6;
  else if (tract.poverty_rate >= 20) breakdown.poverty_rate = 4;
  else if (tract.poverty_rate >= 15) breakdown.poverty_rate = 2;
  else breakdown.poverty_rate = 0;

  // Median Family Income vs State (0-10 points)
  // Lower MFI ratio = more distressed = higher score
  const mfiRatio = tract.state_mfi > 0 
    ? (tract.median_family_income / tract.state_mfi) * 100 
    : 100;
  
  if (mfiRatio <= 50) breakdown.mfi = 10;
  else if (mfiRatio <= 60) breakdown.mfi = 8;
  else if (mfiRatio <= 70) breakdown.mfi = 6;
  else if (mfiRatio <= 80) breakdown.mfi = 4;
  else if (mfiRatio <= 90) breakdown.mfi = 2;
  else breakdown.mfi = 0;

  // Unemployment Rate (0-10 points)
  // Higher unemployment = more distressed = higher score
  if (tract.unemployment_rate >= 15) breakdown.unemployment = 10;
  else if (tract.unemployment_rate >= 12) breakdown.unemployment = 8;
  else if (tract.unemployment_rate >= 9) breakdown.unemployment = 6;
  else if (tract.unemployment_rate >= 6) breakdown.unemployment = 4;
  else if (tract.unemployment_rate >= 4) breakdown.unemployment = 2;
  else breakdown.unemployment = 0;

  // Persistent Poverty County Flag (0 or 3)
  breakdown.ppc_flag = tract.is_persistent_poverty_county ? 3 : 0;

  // Non-Metro Flag (0 or 3)
  breakdown.non_metro_flag = tract.is_non_metro ? 3 : 0;

  // Capital Desert (0-4)
  // For now, use severely distressed as proxy
  // TODO: Integrate actual CDFI Fund capital desert data
  if (tract.is_severely_distressed) {
    breakdown.capital_desert = 4;
  } else if (tract.is_lic_eligible) {
    breakdown.capital_desert = 2;
  }

  const total = Math.min(
    breakdown.poverty_rate +
    breakdown.mfi +
    breakdown.unemployment +
    breakdown.ppc_flag +
    breakdown.non_metro_flag +
    breakdown.capital_desert,
    MAX_DISTRESS
  );

  return {
    total,
    breakdown,
    percentile: (total / MAX_DISTRESS) * 100,
  };
}

// =============================================================================
// PILLAR 2: IMPACT POTENTIAL (0-35 points)
// =============================================================================

export function calculateImpactPotential(input: ScoringInput): ImpactPotentialScore {
  const project = input.project;
  const breakdown = {
    job_creation: 0,
    essential_services: 0,
    lmi_benefit: 0,
    catalytic_effect: 0,
    community_readiness: 0,
    leverage: 0,
  };

  // Job Creation (0-8 points)
  const totalJobs = project.permanent_jobs + (project.construction_jobs || 0) * 0.25;
  if (totalJobs >= 100) breakdown.job_creation = 8;
  else if (totalJobs >= 51) breakdown.job_creation = 6;
  else if (totalJobs >= 26) breakdown.job_creation = 4;
  else if (totalJobs >= 11) breakdown.job_creation = 2;
  else if (totalJobs >= 1) breakdown.job_creation = 1;

  // Essential Services (0-8 points)
  breakdown.essential_services = ESSENTIAL_SERVICE_SCORES[project.sector] || 1;

  // LMI Benefit (0-7 points)
  if (project.serves_lmi_directly && project.employs_lmi_residents) {
    breakdown.lmi_benefit = 7;
  } else if (project.serves_lmi_directly) {
    breakdown.lmi_benefit = 6;
  } else if (project.employs_lmi_residents) {
    breakdown.lmi_benefit = 4;
  } else {
    breakdown.lmi_benefit = 2; // Indirect benefit assumed for LIC project
  }

  // Catalytic Effect (0-6 points)
  switch (project.catalytic_potential) {
    case 'high':
      breakdown.catalytic_effect = 6;
      break;
    case 'medium':
      breakdown.catalytic_effect = 4;
      break;
    case 'low':
      breakdown.catalytic_effect = 2;
      break;
  }

  // Community Readiness (0-3 points)
  if (project.has_local_support) {
    breakdown.community_readiness = 3;
  }

  // Leverage (0-3 points)
  // Ratio of other funding to NMTC request
  if (project.leverage_ratio >= 4) breakdown.leverage = 3;
  else if (project.leverage_ratio >= 2) breakdown.leverage = 2;
  else if (project.leverage_ratio >= 1) breakdown.leverage = 1;

  const total = Math.min(
    breakdown.job_creation +
    breakdown.essential_services +
    breakdown.lmi_benefit +
    breakdown.catalytic_effect +
    breakdown.community_readiness +
    breakdown.leverage,
    MAX_IMPACT
  );

  return {
    total,
    breakdown,
    percentile: (total / MAX_IMPACT) * 100,
  };
}

// =============================================================================
// PILLAR 3: PROJECT READINESS (0-15 points)
// =============================================================================

export function calculateProjectReadiness(input: ScoringInput): ProjectReadinessScore {
  const readiness = input.readiness;
  const breakdown = {
    site_control: 0,
    pro_forma: 0,
    third_party_reports: 0,
    committed_sources: 0,
    timeline: 0,
  };

  // Site Control (0-4 points)
  breakdown.site_control = SITE_CONTROL_SCORES[readiness.site_control] || 0;

  // Pro Forma (0-3 points)
  if (readiness.pro_forma_complete) {
    breakdown.pro_forma = 3;
  } else if (readiness.has_pro_forma) {
    breakdown.pro_forma = 1;
  }

  // Third-Party Reports (0-3 points)
  // Appraisal + Phase I + Market Study
  let reportCount = 0;
  if (readiness.has_appraisal) reportCount++;
  if (readiness.has_phase_i) reportCount++;
  if (readiness.has_market_study) reportCount++;
  breakdown.third_party_reports = reportCount;

  // Committed Sources (0-3 points)
  const commitmentLevel = getCommitmentLevel(readiness.committed_sources_pct);
  breakdown.committed_sources = COMMITMENT_SCORES[commitmentLevel];

  // Timeline (0-2 points)
  if (readiness.timeline_feasible) {
    breakdown.timeline = 2;
  }

  const total = Math.min(
    breakdown.site_control +
    breakdown.pro_forma +
    breakdown.third_party_reports +
    breakdown.committed_sources +
    breakdown.timeline,
    MAX_READINESS
  );

  return {
    total,
    breakdown,
    percentile: (total / MAX_READINESS) * 100,
  };
}

function getCommitmentLevel(pct: number): CommitmentLevel {
  if (pct >= 90) return 'above_90';
  if (pct >= 70) return '70_to_89';
  if (pct >= 50) return '50_to_69';
  return 'below_50';
}

// =============================================================================
// PILLAR 4: MISSION FIT (0-10 points) — CDE-SPECIFIC
// =============================================================================

export function calculateMissionFit(
  input: ScoringInput,
  cdeCriteria?: CDECriteria
): MissionFitScore {
  const breakdown = {
    sector_alignment: 0,
    geographic_alignment: 0,
    deal_size_alignment: 0,
  };

  // If no CDE criteria provided, return neutral score
  if (!cdeCriteria) {
    return {
      total: 5, // Neutral middle score
      breakdown: { sector_alignment: 2, geographic_alignment: 2, deal_size_alignment: 1 },
      percentile: 50,
    };
  }

  // Sector Alignment (0-4 points)
  if (cdeCriteria.target_sectors.includes(input.project.sector)) {
    breakdown.sector_alignment = 4;
  } else if (cdeCriteria.target_sectors.length === 0) {
    // CDE accepts all sectors
    breakdown.sector_alignment = 2;
  }

  // Geographic Alignment (0-4 points)
  const stateMatch = cdeCriteria.target_states.includes(input.project.state);
  const countyMatch = cdeCriteria.target_counties?.includes(input.project.county || '') || false;
  
  if (countyMatch) {
    breakdown.geographic_alignment = 4;
  } else if (stateMatch) {
    breakdown.geographic_alignment = 3;
  } else if (cdeCriteria.target_states.length === 0) {
    // CDE is national
    breakdown.geographic_alignment = 2;
  }

  // Deal Size Alignment (0-2 points)
  const dealSize = input.project.nmtc_request;
  const minSize = cdeCriteria.min_deal_size || 0;
  const maxSize = cdeCriteria.max_deal_size || Infinity;
  const typicalSize = cdeCriteria.typical_deal_size;

  if (dealSize >= minSize && dealSize <= maxSize) {
    if (typicalSize && Math.abs(dealSize - typicalSize) / typicalSize < 0.25) {
      breakdown.deal_size_alignment = 2; // Within 25% of typical
    } else {
      breakdown.deal_size_alignment = 1;
    }
  }

  const total = Math.min(
    breakdown.sector_alignment +
    breakdown.geographic_alignment +
    breakdown.deal_size_alignment,
    MAX_MISSION_FIT
  );

  return {
    total,
    breakdown,
    cde_id: cdeCriteria.id,
    percentile: (total / MAX_MISSION_FIT) * 100,
  };
}

// =============================================================================
// TIER ASSIGNMENT
// =============================================================================

export function assignTier(
  distressPercentile: number,
  impactPercentile: number
): ScoreTier {
  // Tier 1: Distress ≥70% AND Impact ≥65%
  if (
    distressPercentile >= TIER_THRESHOLDS.TIER_1.distress_pct &&
    impactPercentile >= TIER_THRESHOLDS.TIER_1.impact_pct
  ) {
    return 'TIER_1_GREENLIGHT';
  }

  // Tier 2: Distress ≥60% OR Impact ≥60%
  if (
    distressPercentile >= TIER_THRESHOLDS.TIER_2.distress_pct ||
    impactPercentile >= TIER_THRESHOLDS.TIER_2.impact_pct
  ) {
    return 'TIER_2_WATCHLIST';
  }

  // Tier 3: Below thresholds
  return 'TIER_3_DEFER';
}

// =============================================================================
// REASON CODES
// =============================================================================

export function generateReasonCodes(
  input: ScoringInput,
  distress: EconomicDistressScore,
  impact: ImpactPotentialScore,
  readiness: ProjectReadinessScore
): string[] {
  const codes: string[] = [];

  // Distress codes
  if (input.tract.is_severely_distressed) codes.push('SEVERELY_DISTRESSED_TRACT');
  if (input.tract.is_persistent_poverty_county) codes.push('PERSISTENT_POVERTY_COUNTY');
  if (input.tract.is_non_metro) codes.push('NON_METRO_RURAL');
  if (input.tract.is_opportunity_zone) codes.push('OPPORTUNITY_ZONE');
  if (distress.breakdown.poverty_rate >= 8) codes.push('HIGH_POVERTY_TRACT');
  if (distress.breakdown.mfi >= 8) codes.push('LOW_MFI_TRACT');
  if (distress.breakdown.capital_desert >= 3) codes.push('CAPITAL_DESERT');

  // Impact codes
  if (impact.breakdown.essential_services >= 6) {
    codes.push(`ESSENTIAL_SERVICE_${input.project.sector.toUpperCase()}`);
  }
  if (impact.breakdown.job_creation >= 6) codes.push('STRONG_JOB_CREATION');
  if (impact.breakdown.lmi_benefit >= 5) codes.push('DIRECT_LMI_BENEFIT');
  if (impact.breakdown.leverage >= 2) codes.push('STRONG_LEVERAGE');
  if (impact.breakdown.catalytic_effect >= 5) codes.push('HIGH_CATALYTIC_POTENTIAL');

  // Readiness codes
  if (readiness.breakdown.site_control >= 3) codes.push('SITE_CONTROL_CONFIRMED');
  if (readiness.breakdown.pro_forma === 3) codes.push('PRO_FORMA_COMPLETE');
  if (readiness.breakdown.third_party_reports === 3) codes.push('ALL_REPORTS_COMPLETE');
  if (readiness.breakdown.committed_sources >= 2) codes.push('STRONG_CAPITAL_COMMITMENT');

  return codes;
}

// =============================================================================
// SCORE EXPLANATION
// =============================================================================

export function generateExplanation(
  distress: EconomicDistressScore,
  impact: ImpactPotentialScore,
  readiness: ProjectReadinessScore,
  missionFit: MissionFitScore,
  tier: ScoreTier
): string {
  const lines: string[] = [];

  lines.push(`SCORE BREAKDOWN: ${distress.total + impact.total + readiness.total + missionFit.total}/100`);
  lines.push('');
  
  lines.push(`Economic Distress: ${distress.total}/${MAX_DISTRESS} (${distress.percentile.toFixed(0)}%)`);
  lines.push(`  ├─ Poverty Rate: ${distress.breakdown.poverty_rate}/10`);
  lines.push(`  ├─ MFI: ${distress.breakdown.mfi}/10`);
  lines.push(`  ├─ Unemployment: ${distress.breakdown.unemployment}/10`);
  lines.push(`  ├─ PPC: ${distress.breakdown.ppc_flag}/3`);
  lines.push(`  ├─ Non-Metro: ${distress.breakdown.non_metro_flag}/3`);
  lines.push(`  └─ Capital Desert: ${distress.breakdown.capital_desert}/4`);
  lines.push('');

  lines.push(`Impact Potential: ${impact.total}/${MAX_IMPACT} (${impact.percentile.toFixed(0)}%)`);
  lines.push(`  ├─ Job Creation: ${impact.breakdown.job_creation}/8`);
  lines.push(`  ├─ Essential Services: ${impact.breakdown.essential_services}/8`);
  lines.push(`  ├─ LMI Benefit: ${impact.breakdown.lmi_benefit}/7`);
  lines.push(`  ├─ Catalytic Effect: ${impact.breakdown.catalytic_effect}/6`);
  lines.push(`  ├─ Community Readiness: ${impact.breakdown.community_readiness}/3`);
  lines.push(`  └─ Leverage: ${impact.breakdown.leverage}/3`);
  lines.push('');

  lines.push(`Project Readiness: ${readiness.total}/${MAX_READINESS} (${readiness.percentile.toFixed(0)}%)`);
  lines.push(`  ├─ Site Control: ${readiness.breakdown.site_control}/4`);
  lines.push(`  ├─ Pro Forma: ${readiness.breakdown.pro_forma}/3`);
  lines.push(`  ├─ Third-Party Reports: ${readiness.breakdown.third_party_reports}/3`);
  lines.push(`  ├─ Committed Sources: ${readiness.breakdown.committed_sources}/3`);
  lines.push(`  └─ Timeline: ${readiness.breakdown.timeline}/2`);
  lines.push('');

  lines.push(`Mission Fit: ${missionFit.total}/${MAX_MISSION_FIT} (${missionFit.percentile.toFixed(0)}%)`);
  lines.push(`  ├─ Sector: ${missionFit.breakdown.sector_alignment}/4`);
  lines.push(`  ├─ Geography: ${missionFit.breakdown.geographic_alignment}/4`);
  lines.push(`  └─ Deal Size: ${missionFit.breakdown.deal_size_alignment}/2`);
  lines.push('');

  lines.push(`TIER: ${tier.replace(/_/g, ' ')}`);

  return lines.join('\n');
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

export function calculateDealScore(
  input: ScoringInput,
  cdeCriteria?: CDECriteria
): DealScore {
  // Calculate each pillar
  const distress = calculateEconomicDistress(input);
  const impact = calculateImpactPotential(input);
  const readiness = calculateProjectReadiness(input);
  const missionFit = calculateMissionFit(input, cdeCriteria);

  // Calculate total
  const totalScore = distress.total + impact.total + readiness.total + missionFit.total;

  // Assign tier
  const tier = assignTier(distress.percentile, impact.percentile);

  // Generate reason codes
  const reasonCodes = generateReasonCodes(input, distress, impact, readiness);

  // Generate explanation
  const explanation = generateExplanation(distress, impact, readiness, missionFit, tier);

  return {
    deal_id: input.deal_id,
    distress,
    impact,
    readiness,
    mission_fit: missionFit,
    total_score: totalScore,
    tier,
    eligibility_flags: {
      nmtc_eligible: input.tract.is_lic_eligible,
      severely_distressed: input.tract.is_severely_distressed,
      qct: input.tract.is_qct,
      opportunity_zone: input.tract.is_opportunity_zone,
      persistent_poverty_county: input.tract.is_persistent_poverty_county,
      non_metro: input.tract.is_non_metro,
    },
    reason_codes: reasonCodes,
    score_explanation: explanation,
    computed_at: new Date().toISOString(),
    model_version: MODEL_VERSION,
    input_snapshot: input,
  };
}

// =============================================================================
// BATCH SCORING
// =============================================================================

export function calculateBatchScores(
  inputs: ScoringInput[],
  cdeCriteria?: CDECriteria
): DealScore[] {
  return inputs.map(input => calculateDealScore(input, cdeCriteria));
}

// =============================================================================
// SCORE COMPARISON (for ranking)
// =============================================================================

export function compareDealScores(a: DealScore, b: DealScore): number {
  // Tier comparison first (Tier 1 > Tier 2 > Tier 3)
  const tierOrder: Record<ScoreTier, number> = {
    TIER_1_GREENLIGHT: 3,
    TIER_2_WATCHLIST: 2,
    TIER_3_DEFER: 1,
  };

  const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
  if (tierDiff !== 0) return tierDiff;

  // Same tier: compare total scores
  return b.total_score - a.total_score;
}

export function rankDealsByScore(deals: DealScore[]): DealScore[] {
  return [...deals].sort(compareDealScores);
}
