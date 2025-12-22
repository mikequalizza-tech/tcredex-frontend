/**
 * tCredex Readiness Score Calculator
 * 
 * Calculates deal readiness based on completed intake fields.
 */

import { ALL_INTAKE_FIELDS, getFieldsForTier, IntakeTier } from '@/types/intakeTiers';

// =============================================================================
// TYPES
// =============================================================================

export interface ReadinessBreakdownItem {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  status: 'complete' | 'partial' | 'incomplete';
}

export interface ReadinessResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  tier: 'early' | 'developing' | 'advanced' | 'shovel-ready';
  breakdown: ReadinessBreakdownItem[];
  missingRequired: string[];
  completedFields: number;
  totalFields: number;
}

export interface TierDisplay {
  label: string;
  color: 'green' | 'blue' | 'amber' | 'gray';
  textColor: string;
  bgColor: string;
  description: string;
}

// =============================================================================
// SCORING WEIGHTS
// =============================================================================

const CATEGORY_WEIGHTS: Record<string, { maxScore: number; label: string }> = {
  project_basics: { maxScore: 15, label: 'Project Basics' },
  location: { maxScore: 10, label: 'Location' },
  financials: { maxScore: 25, label: 'Financials' },
  sources_uses: { maxScore: 15, label: 'Sources & Uses' },
  jobs_impact: { maxScore: 10, label: 'Jobs & Impact' },
  site_control: { maxScore: 5, label: 'Site Control' },
  third_party_reports: { maxScore: 10, label: 'Third Party Reports' },
  legal_structure: { maxScore: 5, label: 'Legal Structure' },
  sponsor_background: { maxScore: 3, label: 'Sponsor Background' },
  closing_docs: { maxScore: 2, label: 'Closing Documents' },
};

// =============================================================================
// CALCULATE READINESS
// =============================================================================

export function calculateReadiness(data: Record<string, unknown>): ReadinessResult {
  const breakdown: ReadinessBreakdownItem[] = [];
  let totalScore = 0;
  let maxScore = 0;
  const missingRequired: string[] = [];
  let completedFields = 0;
  let totalFields = 0;

  // Calculate by category
  for (const [category, config] of Object.entries(CATEGORY_WEIGHTS)) {
    const categoryFields = ALL_INTAKE_FIELDS.filter(f => f.category === category);
    const requiredFields = categoryFields.filter(f => f.required_at_tier <= 2); // Tier 1-2 = essential
    
    let categoryCompleted = 0;
    let categoryTotal = categoryFields.length;

    for (const field of categoryFields) {
      totalFields++;
      const value = data[field.key];
      const hasValue = value !== undefined && value !== null && value !== '';

      if (hasValue) {
        completedFields++;
        categoryCompleted++;
      } else if (field.required_at_tier <= 2) {
        missingRequired.push(field.label);
      }
    }

    // Calculate category score proportionally
    const categoryScore = categoryTotal > 0 
      ? Math.round((categoryCompleted / categoryTotal) * config.maxScore)
      : 0;

    totalScore += categoryScore;
    maxScore += config.maxScore;

    const status = categoryCompleted === categoryTotal 
      ? 'complete' 
      : categoryCompleted > 0 
        ? 'partial' 
        : 'incomplete';

    breakdown.push({
      id: category,
      label: config.label,
      score: categoryScore,
      maxScore: config.maxScore,
      status,
    });
  }

  // Calculate percentage and tier
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  const tier: ReadinessResult['tier'] = 
    percentage >= 80 ? 'shovel-ready' :
    percentage >= 60 ? 'advanced' :
    percentage >= 40 ? 'developing' : 'early';

  return {
    totalScore,
    maxScore,
    percentage,
    tier,
    breakdown,
    missingRequired: missingRequired.slice(0, 10), // Top 10 missing
    completedFields,
    totalFields,
  };
}

// =============================================================================
// TIER DISPLAY
// =============================================================================

const TIER_DISPLAYS: Record<string, TierDisplay> = {
  'shovel-ready': {
    label: 'Shovel Ready',
    color: 'green',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/20',
    description: 'Ready for closing',
  },
  'advanced': {
    label: 'Advanced',
    color: 'blue',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Due diligence stage',
  },
  'developing': {
    label: 'Developing',
    color: 'amber',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Building momentum',
  },
  'early': {
    label: 'Early Stage',
    color: 'gray',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    description: 'Initial submission',
  },
};

export function getTierDisplay(tier: string): TierDisplay {
  return TIER_DISPLAYS[tier] || TIER_DISPLAYS['early'];
}

// =============================================================================
// QUICK SCORE (for lists/tables)
// =============================================================================

export function getQuickReadinessScore(data: Record<string, unknown>): number {
  const result = calculateReadiness(data);
  return result.totalScore;
}

export function getReadinessTier(data: Record<string, unknown>): string {
  const result = calculateReadiness(data);
  return result.tier;
}
