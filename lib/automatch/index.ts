// tCredex v1.6 - AutoMatch Lib Exports
// Explicit exports to avoid duplicate declarations

// Primary eligibility exports (full implementation)
export {
  type QALICBInput,
  type EligibilityResult,
  isQALICBEligible,
  getDetailedEligibility,
  PROHIBITED_BUSINESSES
} from './eligibility';

// Additional helper from eligibilityEngine
export { getFailedTests } from './eligibilityEngine';

// Match scoring
export {
  type Project,
  type CDEProfile,
  calculateMatchScore,
  getMatchTier
} from './matchScore';
