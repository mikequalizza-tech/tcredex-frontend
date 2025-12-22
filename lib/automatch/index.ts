/**
 * tCredex AutoMatch AI System
 * 
 * Usage:
 * 
 * // Section C Scoring Engine (NEW - Primary)
 * import { calculateDealScore, assignTier } from '@/lib/automatch';
 * const score = calculateDealScore(input);
 * 
 * // CDE Matching Engine (database-backed)
 * import { findMatches, runAutoMatchBatch } from '@/lib/automatch';
 * const result = await findMatches(dealId);
 * 
 * // Legacy Match Scoring (backwards compatible)
 * import { calculateMatchScore, getMatchTier } from '@/lib/automatch';
 * const score = calculateMatchScore(project, cdeProfile);
 * 
 * // QALICB Eligibility
 * import { isQALICBEligible, getDetailedEligibility } from '@/lib/automatch';
 * const eligible = isQALICBEligible(qalicbInput);
 */

// Section C Scoring Engine (NEW - use this)
export {
  calculateDealScore,
  calculateBatchScores,
  assignTier,
  calculateEconomicDistress,
  calculateImpactPotential,
  calculateProjectReadiness,
  calculateMissionFit,
  generateReasonCodes,
  generateExplanation,
  compareDealScores,
  rankDealsByScore,
  MODEL_VERSION,
} from '@/lib/scoring';

// CDE Matching Engine (full database-backed system)
export * from './engine';

// Legacy Match Scoring (backwards compatible)
export * from './matchScore';

// QALICB Eligibility Engine
export * from './eligibility';

// Helper: getFailedTests (used by the demo page)
import { QALICBInput } from './eligibility';

export function getFailedTests(input: QALICBInput): string[] {
  const tests = [
    { key: 'gross_income_test', label: 'Gross Income Test', passed: input.gross_income_test },
    { key: 'tangible_property_test', label: 'Tangible Property Test', passed: input.tangible_property_test },
    { key: 'services_test', label: 'Services Test', passed: input.services_test },
    { key: 'collectibles_test', label: 'No Collectibles', passed: input.collectibles_test },
    { key: 'financial_property_test', label: 'No Financial Property', passed: input.financial_property_test },
    { key: 'active_business', label: 'Active Business', passed: input.active_business },
    { key: 'prohibited_business', label: 'Not Prohibited', passed: !input.prohibited_business },
  ];
  
  return tests.filter(t => !t.passed).map(t => t.label);
}
