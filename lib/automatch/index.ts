/**
 * tCredex AutoMatch AI System
 * 
 * Usage:
 * 
 * // CDE Matching Engine (database-backed)
 * import { findMatches, runAutoMatchBatch } from '@/lib/automatch';
 * const result = await findMatches(dealId);
 * 
 * // Simple Match Scoring (client-side demo)
 * import { calculateMatchScore, getMatchTier } from '@/lib/automatch';
 * const score = calculateMatchScore(project, cdeProfile);
 * 
 * // QALICB Eligibility
 * import { isQALICBEligible, getDetailedEligibility } from '@/lib/automatch';
 * const eligible = isQALICBEligible(qalicbInput);
 */

// CDE Matching Engine (full database-backed system)
export * from './engine';

// Simple Match Scoring (for client-side demos)
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
