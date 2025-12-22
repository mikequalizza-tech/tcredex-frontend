// tCredex v1.6 - Type Exports
// Note: Using explicit exports to avoid naming conflicts

export * from './deal';
export * from './cde';

// Investor - explicit exports (CommitmentStatus conflicts with loi)
export type {
  Investor,
  InvestorType,
  InvestorPersona,
  InvestorCommitment,
} from './investor';
// Alias the investor CommitmentStatus
export type { CommitmentStatus as InvestorCommitmentStatus } from './investor';

export * from './pricing';
export * from './intake';

// Intake Tiers - explicit exports (avoid conflicts with scoring TIER_*)
export type {
  IntakeTier,
  FieldDefinition,
  FieldCategory,
} from './intakeTiers';

export {
  TIER_NAMES as INTAKE_TIER_NAMES,
  TIER_DESCRIPTIONS as INTAKE_TIER_DESCRIPTIONS,
  TIER_TRIGGERS,
  CATEGORY_LABELS,
  ALL_INTAKE_FIELDS,
  TIER_1_FIELDS,
  TIER_2_FIELDS,
  TIER_3_FIELDS,
  TIER_4_FIELDS,
  getFieldsForTier,
  getRequiredFieldsForTier,
  getNewFieldsAtTier,
  getFieldsByCategory,
  getFieldByKey,
} from './intakeTiers';

// Scoring - types (exclude SiteControlStatus which conflicts with intake)
export type {
  ScoreTier,
  EconomicDistressInput,
  EconomicDistressScore,
  ProjectSector,
  ImpactPotentialInput,
  ImpactPotentialScore,
  DocumentStatus,
  CommitmentLevel,
  ProjectReadinessInput,
  ProjectReadinessScore,
  CDECriteria,
  MissionFitInput,
  MissionFitScore,
  DealScore,
  ScoringInput,
  OverrideReasonCode,
  ScoreOverride,
  ScoreRequest,
  ScoreResponse,
  BatchScoreRequest,
  BatchScoreResponse,
} from './scoring';

// Scoring - values (alias to avoid conflict with intake TIER_*)
export {
  TIER_THRESHOLDS,
  TIER_LABELS as SCORE_TIER_LABELS,
  TIER_DESCRIPTIONS as SCORE_TIER_DESCRIPTIONS,
  ESSENTIAL_SERVICE_SCORES,
  SITE_CONTROL_SCORES,
  COMMITMENT_SCORES,
} from './scoring';

// Scoring SiteControlStatus with alias to avoid conflict
export type { SiteControlStatus as ScoringSiteControlStatus } from './scoring';

// LOI - full export (canonical CommitmentStatus lives here)
export * from './loi';
