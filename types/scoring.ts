/**
 * tCredex Section C Scoring Engine - Type Definitions
 * 
 * Canonical Source: docs/chatgpt-generated/SECTION_C_SCORING_ENGINE_FRAMEWORK.md
 * 
 * 4-Pillar Model (100 points total):
 * - Economic Distress: 0-40 points (40%)
 * - Impact Potential: 0-35 points (35%)
 * - Project Readiness: 0-15 points (15%)
 * - Mission Fit: 0-10 points (10%)
 */

// =============================================================================
// SCORE TIERS
// =============================================================================

export type ScoreTier = 'TIER_1_GREENLIGHT' | 'TIER_2_WATCHLIST' | 'TIER_3_DEFER';

export const TIER_THRESHOLDS = {
  TIER_1: { distress_pct: 70, impact_pct: 65 },  // AND logic
  TIER_2: { distress_pct: 60, impact_pct: 60 },  // OR logic
} as const;

export const TIER_LABELS: Record<ScoreTier, string> = {
  TIER_1_GREENLIGHT: 'Greenlight',
  TIER_2_WATCHLIST: 'Watchlist',
  TIER_3_DEFER: 'Defer',
};

export const TIER_DESCRIPTIONS: Record<ScoreTier, string> = {
  TIER_1_GREENLIGHT: 'Auto-route to matching CDEs',
  TIER_2_WATCHLIST: 'Manual review recommended',
  TIER_3_DEFER: 'Needs improvement before matching',
};

// =============================================================================
// PILLAR 1: ECONOMIC DISTRESS (0-40 points)
// =============================================================================

export interface EconomicDistressInput {
  poverty_rate: number;           // Tract poverty rate (0-100)
  poverty_rate_percentile?: number; // Percentile among all tracts (0-100)
  median_family_income: number;   // Tract MFI in dollars
  state_mfi: number;              // State median for comparison
  metro_mfi?: number;             // Metro median for comparison (optional)
  unemployment_rate: number;      // Tract unemployment rate (0-100)
  unemployment_percentile?: number; // Percentile among all tracts (0-100)
  is_persistent_poverty_county: boolean;
  is_non_metro: boolean;
  capital_desert_score?: number;  // 0-4, pre-calculated or we derive
  prior_nmtc_investment?: number; // Historical NMTC $ in tract
}

export interface EconomicDistressScore {
  total: number;                  // 0-40
  breakdown: {
    poverty_rate: number;         // 0-10
    mfi: number;                  // 0-10
    unemployment: number;         // 0-10
    ppc_flag: number;             // 0 or 3
    non_metro_flag: number;       // 0 or 3
    high_migration_flag: number;  // 0 or 2 (bonus for high migration counties)
    capital_desert: number;       // 0-4
    // NEW: Bonus points for concentrated poverty areas
    tribal_area_flag: number;     // 0 or 2 (bonus for tribal areas)
    concentrated_poverty_flag: number;  // 0 or 2 (bonus for RCAP/ACP)
  };
  percentile: number;             // Normalized to 0-100
}

// =============================================================================
// PILLAR 2: IMPACT POTENTIAL (0-35 points)
// =============================================================================

export type ProjectSector = 
  | 'healthcare'
  | 'education'
  | 'childcare'
  | 'food_access'
  | 'community_facility'
  | 'manufacturing'
  | 'mixed_use'
  | 'housing'
  | 'retail'
  | 'hospitality'
  | 'office'
  | 'other';

export const ESSENTIAL_SERVICE_SCORES: Record<ProjectSector, number> = {
  healthcare: 8,
  education: 7,
  childcare: 6,
  food_access: 6,
  community_facility: 5,
  manufacturing: 4,
  mixed_use: 3,
  housing: 3,
  retail: 2,
  hospitality: 2,
  office: 2,
  other: 1,
};

export interface ImpactPotentialInput {
  permanent_jobs_created: number;
  permanent_jobs_retained?: number;
  construction_jobs?: number;
  project_sector: ProjectSector;
  serves_lmi_directly: boolean;     // Direct services to LMI residents
  employs_lmi_residents: boolean;   // Employment focus on LMI
  has_local_support: boolean;       // Community partnerships confirmed
  has_government_support?: boolean; // Letters of support from govt
  leverage_ratio: number;           // Other funding / NMTC request
  catalytic_potential: 'high' | 'medium' | 'low'; // Spillover potential
}

export interface ImpactPotentialScore {
  total: number;                  // 0-35
  breakdown: {
    job_creation: number;         // 0-8
    essential_services: number;   // 0-8
    lmi_benefit: number;          // 0-7
    catalytic_effect: number;     // 0-6
    community_readiness: number;  // 0-3
    leverage: number;             // 0-3
  };
  percentile: number;             // Normalized to 0-100
}

// =============================================================================
// PILLAR 3: PROJECT READINESS (0-15 points)
// =============================================================================

export type SiteControlStatus = 'owned' | 'under_contract' | 'option_loi' | 'identified' | 'none';
export type DocumentStatus = 'complete' | 'in_progress' | 'not_started' | 'not_needed';
export type CommitmentLevel = 'above_90' | '70_to_89' | '50_to_69' | 'below_50';

export const SITE_CONTROL_SCORES: Record<SiteControlStatus, number> = {
  owned: 4,
  under_contract: 3,
  option_loi: 2,
  identified: 0,
  none: 0,
};

export const COMMITMENT_SCORES: Record<CommitmentLevel, number> = {
  above_90: 3,
  '70_to_89': 2,
  '50_to_69': 1,
  below_50: 0,
};

export interface ProjectReadinessInput {
  site_control: SiteControlStatus;
  has_pro_forma: boolean;
  pro_forma_complete: boolean;
  has_appraisal: boolean;
  has_phase_i: boolean;
  has_market_study: boolean;
  committed_sources_pct: number;    // 0-100
  timeline_feasible: boolean;
  construction_start_months?: number; // Months until construction start
  projected_completion_months?: number;
}

export interface ProjectReadinessScore {
  total: number;                  // 0-15
  breakdown: {
    site_control: number;         // 0-4
    pro_forma: number;            // 0-3
    third_party_reports: number;  // 0-3
    committed_sources: number;    // 0-3
    timeline: number;             // 0-2
  };
  percentile: number;             // Normalized to 0-100
}

// =============================================================================
// PILLAR 4: MISSION FIT (0-10 points) — CDE-SPECIFIC
// =============================================================================

export interface CDECriteria {
  id: string;
  name: string;
  target_sectors: ProjectSector[];
  target_states: string[];
  target_counties?: string[];
  min_deal_size?: number;
  max_deal_size?: number;
  typical_deal_size?: number;
  priority_flags?: {
    severely_distressed: boolean;
    non_metro: boolean;
    persistent_poverty: boolean;
    opportunity_zone: boolean;
  };
}

export interface MissionFitInput {
  project_sector: ProjectSector;
  project_state: string;
  project_county?: string;
  deal_size: number;              // NMTC request amount
  is_severely_distressed: boolean;
  is_non_metro: boolean;
  is_persistent_poverty: boolean;
  is_opportunity_zone: boolean;
}

export interface MissionFitScore {
  total: number;                  // 0-10
  breakdown: {
    sector_alignment: number;     // 0-4
    geographic_alignment: number; // 0-4
    deal_size_alignment: number;  // 0-2
  };
  cde_id?: string;                // Which CDE this was scored against
  percentile: number;             // Normalized to 0-100
}

// =============================================================================
// COMBINED SCORE OUTPUT
// =============================================================================

export interface DealScore {
  deal_id: string;
  
  // Individual pillar scores
  distress: EconomicDistressScore;
  impact: ImpactPotentialScore;
  readiness: ProjectReadinessScore;
  mission_fit: MissionFitScore;
  
  // Totals
  total_score: number;            // 0-100
  tier: ScoreTier;
  
  // Eligibility flags
  eligibility_flags: {
    nmtc_eligible: boolean;
    severely_distressed: boolean;
    qct: boolean;                 // Qualified Census Tract
    opportunity_zone: boolean;
    persistent_poverty_county: boolean;
    non_metro: boolean;
    high_migration?: boolean;     // High Migration Rural County
    underserved_state?: boolean;
    // NEW: From FHFA Duty to Serve data
    tribal_area?: boolean;        // Federally recognized Indian tribe area
    rcap?: boolean;               // Racially/Ethnically Concentrated Area of Poverty
    acp?: boolean;                // Area of Concentrated Poverty
    high_opportunity_area?: boolean;  // LIHTC High Opportunity Area
  };
  
  // Explainability
  reason_codes: string[];
  score_explanation?: string;
  
  // Metadata
  computed_at: string;            // ISO timestamp
  model_version: string;
  input_snapshot: ScoringInput;
}

// =============================================================================
// COMBINED INPUT
// =============================================================================

export interface ScoringInput {
  deal_id: string;
  
  // Tract data (from master_tax_credit_sot)
  tract: {
    geoid: string;
    poverty_rate: number;
    median_family_income: number;
    unemployment_rate: number;
    state_mfi: number;
    metro_mfi?: number;
    is_lic_eligible: boolean;
    is_severely_distressed: boolean;
    is_qct: boolean;
    is_opportunity_zone: boolean;
    is_persistent_poverty_county: boolean;
    is_non_metro: boolean;
    is_high_migration?: boolean;  // High Migration Rural County LIC tract
    // NEW: From FHFA Duty to Serve data
    is_tribal_area?: boolean;     // Federally recognized Indian tribe area
    is_rcap?: boolean;            // Racially/Ethnically Concentrated Area of Poverty
    is_acp?: boolean;             // Area of Concentrated Poverty
    is_high_opportunity_area?: boolean;  // LIHTC High Opportunity Area
  };
  
  // Project data (from intake)
  project: {
    sector: ProjectSector;
    state: string;
    county?: string;
    total_project_cost: number;
    nmtc_request: number;
    permanent_jobs: number;
    construction_jobs?: number;
    serves_lmi_directly: boolean;
    employs_lmi_residents: boolean;
    has_local_support: boolean;
    leverage_ratio: number;
    catalytic_potential: 'high' | 'medium' | 'low';
  };
  
  // Readiness data (from intake)
  readiness: {
    site_control: SiteControlStatus;
    has_pro_forma: boolean;
    pro_forma_complete: boolean;
    has_appraisal: boolean;
    has_phase_i: boolean;
    has_market_study: boolean;
    committed_sources_pct: number;
    timeline_feasible: boolean;
  };
  
  // CDE criteria (optional, for mission fit scoring)
  cde_criteria?: CDECriteria;
}

// =============================================================================
// OVERRIDE & AUDIT
// =============================================================================

export type OverrideReasonCode = 
  | 'LOCAL_KNOWLEDGE'
  | 'DATA_ERROR'
  | 'TIMING_ISSUE'
  | 'PROGRAM_SPECIFIC'
  | 'OTHER';

export interface ScoreOverride {
  id: string;
  deal_score_id: string;
  original_tier: ScoreTier;
  new_tier: ScoreTier;
  reason_code: OverrideReasonCode;
  justification: string;
  overridden_by: string;          // User ID
  overridden_at: string;          // ISO timestamp
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ScoreRequest {
  deal_id: string;
  input: ScoringInput;
  cde_id?: string;                // Optional: score against specific CDE
}

export interface ScoreResponse {
  success: boolean;
  score?: DealScore;
  error?: string;
}

export interface BatchScoreRequest {
  deals: ScoringInput[];
  cde_id?: string;
}

export interface BatchScoreResponse {
  success: boolean;
  scores: DealScore[];
  errors?: { deal_id: string; error: string }[];
}
