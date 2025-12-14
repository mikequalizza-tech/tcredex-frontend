/**
 * tCredex Intake v1.1 — Readiness Scoring Rules
 * 
 * Philosophy:
 * - Readiness is program-aware but normalized (0-100)
 * - NOT eligibility, NOT approval
 * - Used for: Marketplace sorting, CDE triage, Closing Room gating, "shovel-ready" signals
 * 
 * ⚠️ LOCKED: Do NOT change scoring weights without explicit approval
 */

export interface ReadinessRule {
  id: string;
  label: string;
  weight: number;
  description: string;
  evaluate: (data: Record<string, any>) => number;
}

export interface ReadinessResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    id: string;
    label: string;
    score: number;
    maxScore: number;
    status: 'complete' | 'partial' | 'missing';
  }[];
  tier: 'shovel-ready' | 'advanced' | 'developing' | 'early';
}

/**
 * Readiness Dimensions (v1 – LOCKED)
 * 
 * | Dimension              | Max  |
 * |------------------------|------|
 * | Site Control           | 20   |
 * | Capital Stack          | 25   |
 * | Documentation          | 25   |
 * | Approvals/Entitlements | 20   |
 * | Timeline Certainty     | 10   |
 * | Total                  | 100  |
 */
export const READINESS_RULES: ReadinessRule[] = [
  {
    id: 'site_control',
    label: 'Site Control',
    weight: 20,
    description: 'Ownership or contractual control of the project site',
    evaluate: (data) => {
      if (data.siteControl === 'Owned' || data.siteControl === 'owned') return 20;
      if (data.siteControl === 'Under Contract' || data.siteControl === 'under_contract') return 10;
      if (data.siteControl === 'LOI' || data.siteControl === 'loi') return 5;
      return 0;
    },
  },
  {
    id: 'capital_stack',
    label: 'Capital Stack Identified',
    weight: 25,
    description: 'Percentage of capital sources committed or identified',
    evaluate: (data) => {
      const pct = data.committedCapitalPct ?? data.capitalStackPct ?? 0;
      if (pct >= 80) return 25;
      if (pct >= 60) return 15;
      if (pct >= 40) return 10;
      if (pct >= 20) return 5;
      return 0;
    },
  },
  {
    id: 'documentation',
    label: 'Core Documentation',
    weight: 25,
    description: 'Required documents uploaded and complete',
    evaluate: (data) => {
      const uploaded = data.docsUploaded ?? 0;
      const required = data.docsRequired ?? 1;
      const ratio = uploaded / required;
      
      if (ratio >= 1) return 25;
      if (ratio >= 0.75) return 20;
      if (ratio >= 0.5) return 15;
      if (ratio >= 0.25) return 5;
      return 0;
    },
  },
  {
    id: 'approvals',
    label: 'Approvals / Entitlements',
    weight: 20,
    description: 'Zoning, permits, and regulatory approvals status',
    evaluate: (data) => {
      if (data.entitlementsApproved || data.approvalsComplete) return 20;
      if (data.entitlementsSubmitted || data.approvalsSubmitted) return 10;
      if (data.entitlementsStarted || data.approvalsStarted) return 5;
      return 0;
    },
  },
  {
    id: 'timeline',
    label: 'Construction Timeline',
    weight: 10,
    description: 'Months until construction start',
    evaluate: (data) => {
      const months = data.constructionStartMonths ?? data.monthsToConstruction ?? 999;
      if (months <= 6) return 10;
      if (months <= 12) return 5;
      if (months <= 18) return 2;
      return 0;
    },
  },
];

/**
 * Get readiness tier based on score
 */
export function getReadinessTier(score: number): ReadinessResult['tier'] {
  if (score >= 80) return 'shovel-ready';
  if (score >= 60) return 'advanced';
  if (score >= 40) return 'developing';
  return 'early';
}

/**
 * Get tier display properties
 */
export function getTierDisplay(tier: ReadinessResult['tier']) {
  switch (tier) {
    case 'shovel-ready':
      return { label: 'Shovel Ready', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' };
    case 'advanced':
      return { label: 'Advanced', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
    case 'developing':
      return { label: 'Developing', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' };
    case 'early':
      return { label: 'Early Stage', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
  }
}
