/**
 * Role-Aware Query Functions
 * ==========================
 * These functions return different data based on the user's organization type.
 *
 * - Sponsors see: CDEs with allocation, Investors seeking opportunities
 * - CDEs see: Projects/Deals seeking allocation (filtered by match criteria)
 * - Investors see: Projects/Deals in later stages (filtered by preferences)
 */

import { getSupabase } from '../supabase';
import { OrgType, isValidOrgType } from './config';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';
import { CDEDealCard } from '@/lib/types/cde';
import { logger } from '@/lib/utils/logger';

// Interface for investor cards (shown to sponsors)
export interface InvestorCard {
  id: string;
  organizationName: string;
  investorType: string;
  programs: string[];
  availableCapital: number;
  minInvestment: number;
  maxInvestment: number;
  geographicFocus: string[];
  projectPreferences: string[];
  activelyInvesting: boolean;
  matchScore?: number;
}

// Interface for marketplace results
export interface MarketplaceResult {
  deals: Deal[];
  cdes: CDEDealCard[];
  investors: InvestorCard[];
}

/**
 * Fetch marketplace data based on organization type
 * This is the main entry point for role-aware marketplace data
 * CRITICAL: Uses authenticated API routes, not direct Supabase queries
 */
export async function fetchMarketplaceForRole(
  orgType: OrgType | undefined,
  orgId?: string
): Promise<MarketplaceResult> {
  try {
    // Validate orgType if provided
    if (orgType && !isValidOrgType(orgType)) {
      logger.error('Invalid organization type provided', { orgType });
      return { deals: [], cdes: [], investors: [] };
    }

    switch (orgType) {
      case 'sponsor':
        return await fetchMarketplaceForSponsorViaAPI(orgId);
      case 'cde':
        return await fetchMarketplaceForCDEViaAPI(orgId);
      case 'investor':
        return await fetchMarketplaceForInvestorViaAPI(orgId);
      default:
        // Unauthenticated users see public deals
        return await fetchPublicMarketplaceViaAPI();
    }
  } catch (error) {
    logger.error('Error fetching marketplace data', error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For Sponsors: Fetch CDEs with allocation + Investors seeking opportunities
 * Uses authenticated API routes
 */
async function fetchMarketplaceForSponsorViaAPI(sponsorOrgId?: string): Promise<MarketplaceResult> {
  try {
    // Fetch CDEs via API
    const cdeRes = await fetch('/api/cdes', { credentials: 'include' });
    const cdeJson = cdeRes.ok ? await cdeRes.json() : { cdes: [] };
    
    const cdes: CDEDealCard[] = (cdeJson.cdes || []).map((cde: any) => ({
      id: cde.id,
      organizationName: cde.organization?.name || 'Unknown CDE',
      missionSnippet: cde.mission_statement || '',
      remainingAllocation: Number(cde.remaining_allocation) || 0,
      allocationDeadline: cde.deployment_deadline || '',
      primaryStates: cde.primary_states || [],
      targetSectors: cde.target_sectors || [],
      impactPriorities: cde.impact_priorities || [],
      dealSizeRange: {
        min: Number(cde.min_deal_size) || 0,
        max: Number(cde.max_deal_size) || 0,
      },
      ruralFocus: cde.rural_focus || false,
      urbanFocus: cde.urban_focus || false,
      requireSeverelyDistressed: cde.require_severely_distressed || false,
      htcExperience: cde.htc_experience || false,
      smallDealFund: cde.small_deal_fund || false,
      status: 'active',
      lastUpdated: cde.updated_at || '',
    }));

    // Fetch investors via API
    const invRes = await fetch('/api/investors', { credentials: 'include' });
    const invJson = invRes.ok ? await invRes.json() : { investors: [] };
    
    const investors: InvestorCard[] = (invJson.investors || []).map((inv: any) => ({
      id: inv.id,
      organizationName: inv.organization?.name || 'Unknown Investor',
      investorType: inv.investor_type || 'institutional',
      programs: inv.target_credit_types || ['NMTC'],
      availableCapital: Number(inv.max_investment) || 0,
      minInvestment: Number(inv.min_investment) || 0,
      maxInvestment: Number(inv.max_investment) || 0,
      geographicFocus: inv.target_states || [],
      projectPreferences: [],
      activelyInvesting: inv.status === 'active',
    }));

    return { deals: [], cdes, investors };
  } catch (error) {
    logger.error('Error fetching sponsor marketplace via API', error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For CDEs: Fetch deals/projects seeking allocation
 * Uses authenticated API routes
 */
async function fetchMarketplaceForCDEViaAPI(cdeOrgId?: string): Promise<MarketplaceResult> {
  try {
    const res = await fetch('/api/deals', { credentials: 'include' });
    const json = res.ok ? await res.json() : { deals: [] };
    
    const deals: Deal[] = (json.deals || []).map((deal: any) => mapDealFromDB(deal));

    // Calculate match scores based on CDE preferences
    // TODO: Fetch CDE preferences and calculate scores
    deals.sort((a, b) => {
      const aScore = (a as any).matchScore || 50;
      const bScore = (b as any).matchScore || 50;
      return bScore - aScore;
    });

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error('Error fetching CDE marketplace via API', error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For Investors: Fetch deals in later stages (LOI, committed, closing)
 * Uses authenticated API routes
 */
async function fetchMarketplaceForInvestorViaAPI(investorOrgId?: string): Promise<MarketplaceResult> {
  try {
    const res = await fetch('/api/deals', { credentials: 'include' });
    const json = res.ok ? await res.json() : { deals: [] };
    
    const deals: Deal[] = (json.deals || []).map((deal: any) => mapDealFromDB(deal));

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error('Error fetching investor marketplace via API', error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For unauthenticated users: Show public marketplace view
 */
async function fetchPublicMarketplaceViaAPI(): Promise<MarketplaceResult> {
  try {
    const res = await fetch('/api/deals', { credentials: 'include' });
    const json = res.ok ? await res.json() : { deals: [] };
    
    const deals: Deal[] = (json.deals || []).map((deal: any) => mapDealFromDB(deal));

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error('Error fetching public marketplace via API', error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * Fetch pipeline data based on role
 * Uses authenticated API routes
 * - Sponsors: Their own deals in various stages
 * - CDEs: Deals they've engaged with (flagged, LOI, committed)
 * - Investors: Deals they've expressed interest in
 */
export async function fetchPipelineForRole(
  orgType: OrgType | undefined,
  orgId?: string
): Promise<Deal[]> {
  if (!orgId) {
    return [];
  }

  try {
    const res = await fetch('/api/deals', { credentials: 'include' });
    const json = res.ok ? await res.json() : { deals: [] };
    
    const deals: Deal[] = (json.deals || []).map((deal: any) => mapDealFromDB(deal));

    return deals;
  } catch (error) {
    logger.error(`Error fetching pipeline for ${orgType}`, error);
    return [];
  }
}

// Helper: Map database record to Deal interface
function mapDealFromDB(deal: any): Deal {
  return {
    id: deal.id,
    projectName: deal.project_name,
    sponsorName: deal.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: Number(deal.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    tractType: (deal.tract_types || []) as TractType[],
    status: (deal.status || 'draft') as DealStatus,
    description: deal.project_description,
    communityImpact: deal.community_benefit,
    projectHighlights: [],
    useOfFunds: deal.total_project_cost ? [
      { category: 'Construction', amount: Number(deal.construction_cost) || 0 },
      { category: 'Acquisition', amount: Number(deal.acquisition_cost) || 0 },
      { category: 'Soft Costs', amount: Number(deal.soft_costs) || 0 },
    ].filter(item => item.amount > 0) : [],
    timeline: [
      { milestone: 'Construction Start', date: deal.construction_start_date || 'TBD', completed: !!deal.construction_start_date },
      { milestone: 'Projected Completion', date: deal.projected_completion_date || 'TBD', completed: false },
    ].filter(item => item.date !== 'TBD'),
    foundedYear: 2020,
    submittedDate: deal.created_at,
    povertyRate: Number(deal.tract_poverty_rate) || 0,
    medianIncome: Number(deal.tract_median_income) || 0,
    jobsCreated: deal.jobs_created || 0,
    visible: deal.visible ?? true,
    coordinates: deal.latitude && deal.longitude ? [deal.longitude, deal.latitude] : undefined,
    projectCost: Number(deal.total_project_cost) || 0,
    financingGap: Number(deal.financing_gap) || 0,
    censusTract: deal.census_tract,
    unemployment: Number(deal.tract_unemployment) || 0,
  };
}

// Helper: Calculate match score between a deal and CDE preferences
function calculateMatchScore(deal: Deal, cdePreferences: any): number {
  let score = 50; // Base score

  // State match: +20 points
  if (cdePreferences.primary_states?.includes(deal.state)) {
    score += 20;
  }

  // Sector match: +15 points (would need deal.sector field)
  // TODO: Add sector matching when sector field is available

  // Deal size in preferred range: +15 points
  const min = cdePreferences.min_deal_size || 0;
  const max = cdePreferences.max_deal_size || Infinity;
  if (deal.allocation >= min && deal.allocation <= max) {
    score += 15;
  }

  // Severely distressed tract: +10 points if CDE requires it
  if (cdePreferences.require_severely_distressed && deal.tractType.includes('SD')) {
    score += 10;
  }

  // QCT bonus: +5 points
  if (deal.tractType.includes('QCT')) {
    score += 5;
  }

  return Math.min(100, score);
}
