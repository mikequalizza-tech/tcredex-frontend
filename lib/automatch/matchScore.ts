/**
 * tCredex AutoMatch Score Calculator
 * 
 * UPDATED: Now uses Section C Scoring Engine as the source of truth
 * 
 * This file provides backwards compatibility for existing components
 * that use the old matchScore API while delegating to the new engine.
 */

import { 
  calculateDealScore, 
  assignTier,
  type ScoringInput,
  type DealScore,
  type ScoreTier,
} from '@/lib/scoring';

// =============================================================================
// LEGACY INTERFACE (for backwards compatibility)
// =============================================================================

export interface Project {
  state: string;
  severely_distressed: boolean;
  programs: string[];
  impact_score: number;
  project_type: string;
  
  // New fields for Section C scoring
  poverty_rate?: number;
  median_family_income?: number;
  unemployment_rate?: number;
  state_mfi?: number;
  is_persistent_poverty_county?: boolean;
  is_non_metro?: boolean;
  is_opportunity_zone?: boolean;
  is_qct?: boolean;
  permanent_jobs?: number;
  construction_jobs?: number;
  serves_lmi_directly?: boolean;
  employs_lmi_residents?: boolean;
  has_local_support?: boolean;
  leverage_ratio?: number;
  site_control?: string;
  has_pro_forma?: boolean;
  pro_forma_complete?: boolean;
  has_appraisal?: boolean;
  has_phase_i?: boolean;
  has_market_study?: boolean;
  committed_sources_pct?: number;
  timeline_feasible?: boolean;
  nmtc_request?: number;
  total_project_cost?: number;
  county?: string;
  census_tract?: string;
  deal_id?: string;
}

export interface CDEProfile {
  id?: string;
  name?: string;
  focus_state: string;
  programs: string[];
  preferred_type: string;
  target_states?: string[];
  target_sectors?: string[];
  min_deal_size?: number;
  max_deal_size?: number;
  typical_deal_size?: number;
}

// =============================================================================
// LEGACY FUNCTION (preserved for backwards compatibility)
// =============================================================================

/**
 * @deprecated Use calculateDealScore from @/lib/scoring instead
 */
export function calculateMatchScore(project: Project, cdeProfile: CDEProfile): number {
  // If project has full Section C data, use new engine
  if (hasFullScoringData(project)) {
    const input = convertToScoringInput(project, cdeProfile);
    const score = calculateDealScore(input, cdeProfile.id ? {
      id: cdeProfile.id,
      name: cdeProfile.name || 'CDE',
      target_sectors: (cdeProfile.target_sectors || [cdeProfile.preferred_type]).filter(Boolean) as any[],
      target_states: cdeProfile.target_states || [cdeProfile.focus_state].filter(Boolean),
      min_deal_size: cdeProfile.min_deal_size,
      max_deal_size: cdeProfile.max_deal_size,
      typical_deal_size: cdeProfile.typical_deal_size,
    } : undefined);
    
    return score.total_score;
  }
  
  // Fallback to simplified legacy scoring
  return calculateLegacyScore(project, cdeProfile);
}

// =============================================================================
// CHECK IF FULL SCORING DATA AVAILABLE
// =============================================================================

function hasFullScoringData(project: Project): boolean {
  return (
    project.poverty_rate !== undefined &&
    project.median_family_income !== undefined &&
    project.unemployment_rate !== undefined &&
    project.state_mfi !== undefined
  );
}

// =============================================================================
// CONVERT LEGACY PROJECT TO SCORING INPUT
// =============================================================================

function convertToScoringInput(project: Project, cdeProfile?: CDEProfile): ScoringInput {
  // Map project_type to ProjectSector
  const sectorMap: Record<string, string> = {
    'Healthcare': 'healthcare',
    'Education': 'education',
    'Childcare': 'childcare',
    'Food Access': 'food_access',
    'Community Facility': 'community_facility',
    'Manufacturing': 'manufacturing',
    'Mixed-Use': 'mixed_use',
    'Housing': 'housing',
    'Retail': 'retail',
    'Hospitality': 'hospitality',
    'Office': 'office',
  };
  
  const sector = sectorMap[project.project_type] || 'other';
  
  // Map site_control to SiteControlStatus
  const siteControlMap: Record<string, string> = {
    'Owned': 'owned',
    'Under Contract': 'under_contract',
    'LOI': 'option_loi',
    'Option': 'option_loi',
    'Negotiations': 'identified',
    'None': 'none',
  };
  
  const siteControl = siteControlMap[project.site_control || ''] || 'none';
  
  return {
    deal_id: project.deal_id || `temp-${Date.now()}`,
    tract: {
      geoid: project.census_tract || '',
      poverty_rate: project.poverty_rate || 0,
      median_family_income: project.median_family_income || 0,
      unemployment_rate: project.unemployment_rate || 0,
      state_mfi: project.state_mfi || 50000,
      is_lic_eligible: true, // Assume eligible if in system
      is_severely_distressed: project.severely_distressed,
      is_qct: project.is_qct || false,
      is_opportunity_zone: project.is_opportunity_zone || false,
      is_persistent_poverty_county: project.is_persistent_poverty_county || false,
      is_non_metro: project.is_non_metro || false,
    },
    project: {
      sector: sector as any,
      state: project.state,
      county: project.county,
      total_project_cost: project.total_project_cost || 0,
      nmtc_request: project.nmtc_request || 0,
      permanent_jobs: project.permanent_jobs || 0,
      construction_jobs: project.construction_jobs || 0,
      serves_lmi_directly: project.serves_lmi_directly || false,
      employs_lmi_residents: project.employs_lmi_residents || false,
      has_local_support: project.has_local_support || false,
      leverage_ratio: project.leverage_ratio || 1,
      catalytic_potential: project.impact_score >= 75 ? 'high' : 
                          project.impact_score >= 50 ? 'medium' : 'low',
    },
    readiness: {
      site_control: siteControl as any,
      has_pro_forma: project.has_pro_forma || false,
      pro_forma_complete: project.pro_forma_complete || false,
      has_appraisal: project.has_appraisal || false,
      has_phase_i: project.has_phase_i || false,
      has_market_study: project.has_market_study || false,
      committed_sources_pct: project.committed_sources_pct || 0,
      timeline_feasible: project.timeline_feasible || true,
    },
  };
}

// =============================================================================
// LEGACY SCORING (simplified fallback)
// =============================================================================

function calculateLegacyScore(project: Project, cdeProfile: CDEProfile): number {
  let score = 0;

  // Geographic match (20 pts)
  if (project.state === cdeProfile.focus_state) score += 20;
  
  // Severely distressed bonus (25 pts)
  if (project.severely_distressed) score += 25;
  
  // Program alignment (25 pts max)
  if (project.programs.includes('NMTC') && cdeProfile.programs.includes('NMTC')) score += 25;
  if (project.programs.includes('HTC') && cdeProfile.programs.includes('HTC')) score += 10;
  if (project.programs.includes('LIHTC') && cdeProfile.programs.includes('LIHTC')) score += 10;
  
  // Impact score bonus (20 pts max)
  if (project.impact_score >= 75) score += 20;
  else if (project.impact_score >= 50) score += 10;
  
  // Project type match (10 pts)
  if (project.project_type === cdeProfile.preferred_type) score += 10;

  return Math.min(score, 100);
}

// =============================================================================
// TIER MAPPING
// =============================================================================

export type LegacyTier = 'Excellent' | 'Good' | 'Fair' | 'Poor';

const TIER_MAP: Record<ScoreTier, LegacyTier> = {
  'TIER_1_GREENLIGHT': 'Excellent',
  'TIER_2_WATCHLIST': 'Good',
  'TIER_3_DEFER': 'Fair',
};

/**
 * Get tier label from score
 * Now maps to Section C tiers internally
 */
export function getMatchTier(score: number): LegacyTier {
  // Map score to approximate tier
  // Note: This is a simplification - full Section C needs distress + impact separately
  if (score >= 80) return 'Excellent';  // ~TIER_1_GREENLIGHT
  if (score >= 60) return 'Good';       // ~TIER_2_WATCHLIST
  if (score >= 40) return 'Fair';       // ~TIER_3_DEFER
  return 'Poor';
}

/**
 * Convert Section C tier to legacy tier
 */
export function convertTierToLegacy(tier: ScoreTier): LegacyTier {
  return TIER_MAP[tier] || 'Fair';
}

/**
 * Get Section C tier from score components
 */
export function getSectionCTier(distressPercent: number, impactPercent: number): ScoreTier {
  return assignTier(distressPercent, impactPercent);
}

// =============================================================================
// NEW EXPORTS (use these going forward)
// =============================================================================

export { calculateDealScore, assignTier } from '@/lib/scoring';
export type { DealScore, ScoreTier, ScoringInput } from '@/lib/scoring';
