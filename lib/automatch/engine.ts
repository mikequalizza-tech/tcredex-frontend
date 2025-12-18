/**
 * tCredex AutoMatch AI Engine
 * 
 * Intelligent CDE-Deal matching based on:
 * - Geographic alignment
 * - Sector preferences
 * - Allocation availability
 * - Historical deal patterns
 * - Distress criteria alignment
 */

import { supabaseAdmin } from '@/lib/supabase';
import { notify } from '@/lib/notifications';

// ============================================
// TYPES
// ============================================

export interface Deal {
  id: string;
  projectName: string;
  sponsorName: string;
  programType: string;
  allocationAmount: number;
  state: string;
  city: string;
  censusTract: string;
  sector: string;
  isQct: boolean;
  isSeverelyDistressed: boolean;
  distressScore: number;
}

export interface CDE {
  id: string;
  name: string;
  states: string[];
  sectors: string[];
  minAllocation: number;
  maxAllocation: number;
  availableAllocation: number;
  prefersQct: boolean;
  prefersDistressed: boolean;
  historicalSectors: string[];
  contactEmail: string;
  contactName: string;
}

export interface MatchScore {
  cdeId: string;
  cdeName: string;
  totalScore: number;
  breakdown: {
    geographic: number;
    sector: number;
    allocation: number;
    distress: number;
    historical: number;
  };
  matchStrength: 'excellent' | 'good' | 'fair' | 'weak';
  reasons: string[];
}

export interface MatchResult {
  dealId: string;
  projectName: string;
  matches: MatchScore[];
  timestamp: string;
}

// ============================================
// SCORING WEIGHTS
// ============================================

export const SCORING_WEIGHTS = {
  geographic: 30,
  sector: 25,
  allocation: 20,
  distress: 15,
  historical: 10,
};

export const MATCH_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
  weak: 0,
};

// ============================================
// SCORING FUNCTIONS
// ============================================

function scoreGeographic(deal: Deal, cde: CDE): number {
  if (cde.states.includes(deal.state)) return 100;
  if (cde.states.length === 0) return 70;
  return 0;
}

function scoreSector(deal: Deal, cde: CDE): number {
  if (cde.sectors.includes(deal.sector)) return 100;
  if (cde.historicalSectors.includes(deal.sector)) return 80;
  if (cde.sectors.length === 0) return 50;
  return 0;
}

function scoreAllocation(deal: Deal, cde: CDE): number {
  const amount = deal.allocationAmount;
  if (amount < cde.minAllocation) return 20;
  if (amount > cde.maxAllocation) return 10;
  if (amount > cde.availableAllocation) return 30;
  
  const ratio = amount / cde.availableAllocation;
  if (ratio >= 0.3 && ratio <= 0.7) return 100;
  if (ratio >= 0.1 && ratio <= 0.9) return 80;
  return 60;
}

function scoreDistress(deal: Deal, cde: CDE): number {
  let score = 50;
  if (deal.isQct && cde.prefersQct) score += 30;
  if (deal.isSeverelyDistressed && cde.prefersDistressed) score += 20;
  if (deal.distressScore >= 80) score += 10;
  return Math.min(score, 100);
}

function scoreHistorical(): number {
  return 50;
}

function calculateMatchScoreInternal(deal: Deal, cde: CDE): MatchScore {
  const breakdown = {
    geographic: scoreGeographic(deal, cde),
    sector: scoreSector(deal, cde),
    allocation: scoreAllocation(deal, cde),
    distress: scoreDistress(deal, cde),
    historical: scoreHistorical(),
  };
  
  const totalScore = Math.round(
    (breakdown.geographic * SCORING_WEIGHTS.geographic +
     breakdown.sector * SCORING_WEIGHTS.sector +
     breakdown.allocation * SCORING_WEIGHTS.allocation +
     breakdown.distress * SCORING_WEIGHTS.distress +
     breakdown.historical * SCORING_WEIGHTS.historical) / 100
  );
  
  let matchStrength: MatchScore['matchStrength'] = 'weak';
  if (totalScore >= MATCH_THRESHOLDS.excellent) matchStrength = 'excellent';
  else if (totalScore >= MATCH_THRESHOLDS.good) matchStrength = 'good';
  else if (totalScore >= MATCH_THRESHOLDS.fair) matchStrength = 'fair';
  
  const reasons: string[] = [];
  if (breakdown.geographic === 100) reasons.push(`Serves ${deal.state}`);
  if (breakdown.sector >= 80) reasons.push(`${deal.sector} focus`);
  if (breakdown.allocation >= 80) reasons.push('Allocation size fits');
  if (breakdown.distress >= 80) reasons.push('Prefers distressed tracts');
  
  return {
    cdeId: cde.id,
    cdeName: cde.name,
    totalScore,
    breakdown,
    matchStrength,
    reasons,
  };
}

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

export async function findMatches(
  dealId: string,
  options: {
    minScore?: number;
    maxResults?: number;
    notifyMatches?: boolean;
  } = {}
): Promise<MatchResult> {
  const {
    minScore = MATCH_THRESHOLDS.fair,
    maxResults = 10,
    notifyMatches = true,
  } = options;

  // Get deal details
  const { data: dealData, error: dealError } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (dealError || !dealData) {
    throw new Error('Deal not found');
  }

  const deal: Deal = {
    id: dealData.id,
    projectName: dealData.project_name,
    sponsorName: dealData.sponsor_name,
    programType: dealData.program_type,
    allocationAmount: dealData.allocation_amount || 0,
    state: dealData.state,
    city: dealData.city,
    censusTract: dealData.census_tract,
    sector: dealData.project_type || 'General',
    isQct: dealData.is_qct || false,
    isSeverelyDistressed: dealData.is_severely_distressed || false,
    distressScore: dealData.distress_score || 0,
  };

  // Get all active CDEs
  const { data: cdeData, error: cdeError } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('type', 'CDE')
    .eq('is_active', true);

  if (cdeError) {
    throw new Error('Failed to fetch CDEs');
  }

  const matches: MatchScore[] = [];

  for (const cdeRow of cdeData || []) {
    const cde: CDE = {
      id: cdeRow.id,
      name: cdeRow.name,
      states: cdeRow.service_states || [],
      sectors: cdeRow.sectors || [],
      minAllocation: cdeRow.min_allocation || 0,
      maxAllocation: cdeRow.max_allocation || 100000000,
      availableAllocation: cdeRow.available_allocation || 0,
      prefersQct: cdeRow.prefers_qct || false,
      prefersDistressed: cdeRow.prefers_distressed || false,
      historicalSectors: cdeRow.historical_sectors || [],
      contactEmail: cdeRow.contact_email || '',
      contactName: cdeRow.contact_name || '',
    };

    const score = calculateMatchScoreInternal(deal, cde);
    if (score.totalScore >= minScore) {
      matches.push(score);
    }
  }

  matches.sort((a, b) => b.totalScore - a.totalScore);
  const topMatches = matches.slice(0, maxResults);

  if (notifyMatches && topMatches.length > 0) {
    for (const match of topMatches.filter(m => m.matchStrength === 'excellent' || m.matchStrength === 'good')) {
      try {
        await notify.cdeMatch(dealId, deal.projectName, match.cdeName);
      } catch (error) {
        console.error('Failed to send match notification:', error);
      }
    }
  }

  for (const match of topMatches) {
    await supabaseAdmin.from('deal_matches').upsert({
      deal_id: dealId,
      cde_id: match.cdeId,
      score: match.totalScore,
      match_strength: match.matchStrength,
      breakdown: match.breakdown,
      reasons: match.reasons,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'deal_id,cde_id',
    });
  }

  return {
    dealId,
    projectName: deal.projectName,
    matches: topMatches,
    timestamp: new Date().toISOString(),
  };
}

export async function runAutoMatchBatch(): Promise<{
  processed: number;
  matches: number;
}> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: deals } = await supabaseAdmin
    .from('deals')
    .select('id')
    .eq('status', 'available')
    .or(`last_matched_at.is.null,last_matched_at.lt.${oneDayAgo.toISOString()}`);

  let totalMatches = 0;

  for (const deal of deals || []) {
    try {
      const result = await findMatches(deal.id, { notifyMatches: true });
      totalMatches += result.matches.length;

      await supabaseAdmin
        .from('deals')
        .update({ last_matched_at: new Date().toISOString() })
        .eq('id', deal.id);
    } catch (error) {
      console.error(`AutoMatch failed for deal ${deal.id}:`, error);
    }
  }

  return {
    processed: deals?.length || 0,
    matches: totalMatches,
  };
}
