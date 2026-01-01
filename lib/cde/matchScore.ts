/**
 * CDE Match Score Calculator
 *
 * Calculates how well a deal matches a CDE's criteria
 */

import { CDEDealCard } from '@/lib/types/cde';

interface DealCriteria {
  state: string;
  projectType: string;
  allocationRequest: number;
  severelyDistressed?: boolean;
}

interface MatchResult {
  score: number;
  reasons: string[];
}

/**
 * Calculate how well a deal matches a CDE's criteria
 */
export function calculateCDEMatchScore(cde: CDEDealCard, deal: DealCriteria): MatchResult {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Geographic match
  if (cde.primaryStates.includes(deal.state)) {
    score += 20;
    reasons.push(`Serves ${deal.state}`);
  } else if (cde.primaryStates.length === 0) {
    score += 10;
    reasons.push('National focus');
  }

  // Sector match
  if (cde.targetSectors.some(s => s.toLowerCase().includes(deal.projectType.toLowerCase()))) {
    score += 15;
    reasons.push(`${deal.projectType} focus`);
  }

  // Allocation size fit
  if (deal.allocationRequest >= cde.dealSizeRange.min && deal.allocationRequest <= cde.dealSizeRange.max) {
    score += 10;
    reasons.push('Allocation size fits');
  }

  // Distress preferences
  if (deal.severelyDistressed && cde.requireSeverelyDistressed) {
    score += 5;
    reasons.push('Prefers distressed tracts');
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}
