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
import { OrgType } from './config';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';
import { CDEDealCard } from '@/lib/types/cde';
import { logger } from '@/lib/utils/logger';
import { fetchApi } from '../api/fetch-utils';

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
    const cdeResult = await fetchApi<{ cdes?: any[] }>('/api/cdes');
    const cdeJson = cdeResult.success && cdeResult.data ? cdeResult.data : { cdes: [] };
    
    const cdes: CDEDealCard[] = (cdeJson.cdes || []).map((cde: any) => {
      // Map from cdes_merged table structure (used by /api/cdes)
      // The API already returns normalized field names
      const orgId = cde.organization_id || cde.organizationId;
      // API returns 'name' field directly from cdes_merged
      const name = cde.name || cde.organization?.name || 'Unknown CDE';
      const remainingAlloc = cde.remaining_allocation || cde.amount_remaining || 0;
      // service_area is a string field in cdes_merged (e.g., "National", "Regional", "State-specific")
      const serviceArea = cde.service_area || cde.service_area_type || '';
      // predominant_market is a string field in cdes_merged (e.g., "Healthcare", "Real Estate")
      const predominantMarket = cde.predominant_market || '';
      
      return {
        id: cde.id,
        organizationId: orgId,
        organizationName: name,
        missionSnippet: cde.mission_statement || cde.description || '',
        remainingAllocation: Number(remainingAlloc) || 0,
        allocationDeadline: cde.deployment_deadline || '',
        primaryStates: Array.isArray(cde.primary_states) ? cde.primary_states : [],
        targetSectors: Array.isArray(cde.target_sectors) ? cde.target_sectors : [],
        impactPriorities: Array.isArray(cde.impact_priorities) ? cde.impact_priorities : [],
        serviceArea: serviceArea, // String: "National", "Regional", etc.
        predominantMarket: predominantMarket, // String: "Healthcare", "Real Estate", etc.
        dealSizeRange: {
          min: Number(cde.min_deal_size) || 0,
          max: Number(cde.max_deal_size) || 0,
        },
        ruralFocus: Boolean(cde.rural_focus),
        urbanFocus: Boolean(cde.urban_focus ?? true),
        requireSeverelyDistressed: Boolean(cde.require_severely_distressed),
        htcExperience: Boolean(cde.htc_experience),
        smallDealFund: Boolean(cde.small_deal_fund),
        status: cde.status || 'active',
        lastUpdated: cde.updated_at || cde.created_at || '',
        // Extra fields for completeness
        website: cde.website || '',
        city: cde.city || '',
        state: cde.state || '',
        contactName: cde.primary_contact_name || cde.contact_name || '',
        contactEmail: cde.primary_contact_email || cde.contact_email || '',
      };
    });

    // Fetch investors via API
    const invResult = await fetchApi<{ investors?: any[] }>('/api/investors');
    const invJson = invResult.success && invResult.data ? invResult.data : { investors: [] };
    
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
    const result = await fetchApi<{ deals?: any[] }>('/api/deals');
    const json = result.success && result.data ? result.data : { deals: [] };
    
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
    const result = await fetchApi<{ deals?: any[] }>('/api/deals');
    const json = result.success && result.data ? result.data : { deals: [] };
    
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
    // Public marketplace doesn't require auth, but still use fetchApi for consistency
    const result = await fetchApi<{ deals?: any[] }>('/api/deals', { requireAuth: false });
    const json = result.success && result.data ? result.data : { deals: [] };
    
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
    const result = await fetchApi<{ deals?: any[] }>('/api/deals');
    const json = result.success && result.data ? result.data : { deals: [] };
    
    const deals: Deal[] = (json.deals || []).map((deal: any) => mapDealFromDB(deal));

    return deals;
  } catch (error) {
    logger.error(`Error fetching pipeline for ${orgType}`, error);
    return [];
  }
}

// Helper: Map database record to Deal interface
function mapDealFromDB(deal: any): Deal {
  // Determine completion date from various possible fields
  const completionDate = deal.projected_completion_date || 
                        deal.estimated_completion || 
                        deal.completion_date ||
                        deal.timeline?.find((t: any) => t.milestone?.includes('Completion'))?.date;

  // Determine shovel ready status
  const shovelReady = deal.shovel_ready !== undefined 
    ? Boolean(deal.shovel_ready)
    : deal.site_control === 'owned' || deal.site_control === 'under_contract';

  return {
    id: deal.id,
    projectName: deal.project_name,
    sponsorName: deal.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: Number(deal.nmtc_financing_requested || deal.nmtc_request || deal.allocation) || 0,
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    address: deal.address,
    tractType: (deal.tract_types || deal.tract_type || []) as TractType[],
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
      { milestone: 'Projected Completion', date: completionDate || 'TBD', completed: false },
    ].filter(item => item.date !== 'TBD'),
    foundedYear: 2020,
    submittedDate: deal.created_at,
    povertyRate: Number(deal.tract_poverty_rate || deal.poverty_rate) || 0,
    medianIncome: Number(deal.tract_median_income || deal.median_income) || 0,
    jobsCreated: deal.jobs_created || 0,
    visible: deal.visible ?? true,
    coordinates: deal.latitude && deal.longitude ? [deal.longitude, deal.latitude] : undefined,
    projectCost: Number(deal.total_project_cost || deal.project_cost) || 0,
    financingGap: Number(deal.financing_gap) || 0,
    censusTract: deal.census_tract,
    unemployment: Number(deal.tract_unemployment || deal.unemployment) || 0,
    shovelReady: shovelReady,
    completionDate: completionDate,
    // Additional financial fields
    stateNMTCAllocation: Number(deal.state_nmtc_allocation_request || deal.state_nmtc_allocation) || 0,
    htcAmount: deal.programType === 'HTC' 
      ? Number(deal.project_gross_htc || deal.htc_amount || deal.allocation) || 0
      : Number(deal.project_gross_htc || deal.htc_amount) || 0,
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
