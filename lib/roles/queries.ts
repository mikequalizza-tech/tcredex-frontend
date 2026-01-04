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
 */
export async function fetchMarketplaceForRole(
  orgType: OrgType | undefined,
  orgId?: string
): Promise<MarketplaceResult> {
  switch (orgType) {
    case 'sponsor':
      return fetchMarketplaceForSponsor(orgId);
    case 'cde':
      return fetchMarketplaceForCDE(orgId);
    case 'investor':
      return fetchMarketplaceForInvestor(orgId);
    default:
      // Unauthenticated users see public deals
      return fetchPublicMarketplace();
  }
}

/**
 * For Sponsors: Fetch CDEs with allocation + Investors seeking opportunities
 */
async function fetchMarketplaceForSponsor(sponsorOrgId?: string): Promise<MarketplaceResult> {
  const supabase = getSupabase();

  // Fetch CDEs with available allocation
  const { data: cdeData, error: cdeError } = await supabase
    .from('cdes')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug
      )
    `)
    .eq('status', 'active')
    .gt('remaining_allocation', 0)
    .order('remaining_allocation', { ascending: false });

  // Silently handle - empty table or RLS is expected during beta
  // Only log actual connection/permission errors, not empty results
  if (cdeError && cdeError.code !== 'PGRST116') {
    logger.debug('CDEs query note', cdeError);
  }

  const cdes: CDEDealCard[] = (cdeData || []).map((cde: any) => ({
    id: cde.id,
    organizationName: cde.organizations?.name || 'Unknown CDE',
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

  // Fetch active investors
  const { data: investorData, error: investorError } = await supabase
    .from('investors')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug
      )
    `)
    .eq('status', 'active');

  // Silently handle - empty table or RLS is expected during beta
  if (investorError && investorError.code !== 'PGRST116') {
    logger.debug('Investors query note', investorError);
  }

  const investors: InvestorCard[] = (investorData || []).map((inv: any) => ({
    id: inv.id,
    organizationName: inv.organizations?.name || 'Unknown Investor',
    investorType: inv.investor_type || 'institutional',
    programs: inv.programs || ['NMTC'],
    availableCapital: Number(inv.available_capital) || 0,
    minInvestment: Number(inv.min_investment) || 0,
    maxInvestment: Number(inv.max_investment) || 0,
    geographicFocus: inv.geographic_focus || [],
    projectPreferences: inv.project_preferences || [],
    activelyInvesting: inv.status === 'active',
  }));

  return { deals: [], cdes, investors };
}

/**
 * For CDEs: Fetch deals/projects seeking allocation
 * Filtered by CDE's investment criteria (state, deal size, sectors)
 */
async function fetchMarketplaceForCDE(cdeOrgId?: string): Promise<MarketplaceResult> {
  const supabase = getSupabase();

  // First, get CDE's investment criteria if we have their org ID
  let cdePreferences: any = null;
  if (cdeOrgId) {
    const { data: cdeData } = await supabase
      .from('cdes')
      .select('*')
      .eq('organization_id', cdeOrgId)
      .single();
    cdePreferences = cdeData;
  }

  // Fetch deals for CDE review
  // For Beta: show all deals regardless of visible/status
  let query = supabase
    .from('deals')
    .select('*');

  // Apply CDE preference filters if available
  if (cdePreferences) {
    // Filter by states if CDE has state preferences
    if (cdePreferences.primary_states?.length > 0) {
      query = query.in('state', cdePreferences.primary_states);
    }
    // Filter by deal size range
    if (cdePreferences.min_deal_size) {
      query = query.gte('nmtc_financing_requested', cdePreferences.min_deal_size);
    }
    if (cdePreferences.max_deal_size) {
      query = query.lte('nmtc_financing_requested', cdePreferences.max_deal_size);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching deals for CDE marketplace', error);
    return { deals: [], cdes: [], investors: [] };
  }

  const deals: Deal[] = (data || []).map((deal: any) => mapDealFromDB(deal));

  // Calculate match scores based on CDE preferences
  if (cdePreferences) {
    deals.forEach(deal => {
      (deal as any).matchScore = calculateMatchScore(deal, cdePreferences);
    });
    // Sort by match score descending
    deals.sort((a, b) => ((b as any).matchScore || 0) - ((a as any).matchScore || 0));
  }

  return { deals, cdes: [], investors: [] };
}

/**
 * For Investors: Fetch deals in later stages (LOI, committed, closing)
 * Filtered by investor preferences
 */
async function fetchMarketplaceForInvestor(investorOrgId?: string): Promise<MarketplaceResult> {
  const supabase = getSupabase();

  // Get investor preferences if available
  let investorPreferences: any = null;
  if (investorOrgId) {
    const { data: invData } = await supabase
      .from('investors')
      .select('*')
      .eq('organization_id', investorOrgId)
      .single();
    investorPreferences = invData;
  }

  // Investors see deals that have progressed past initial review
  // For Beta: show all deals regardless of visible/status
  let query = supabase
    .from('deals')
    .select('*');

  // Apply investor preference filters
  if (investorPreferences) {
    if (investorPreferences.geographic_focus?.length > 0) {
      query = query.in('state', investorPreferences.geographic_focus);
    }
    if (investorPreferences.min_investment) {
      query = query.gte('nmtc_financing_requested', investorPreferences.min_investment);
    }
    if (investorPreferences.max_investment) {
      query = query.lte('nmtc_financing_requested', investorPreferences.max_investment);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching deals for investor marketplace', error);
    return { deals: [], cdes: [], investors: [] };
  }

  const deals: Deal[] = (data || []).map((deal: any) => mapDealFromDB(deal));

  return { deals, cdes: [], investors: [] };
}

/**
 * For unauthenticated users: Show public marketplace view
 */
async function fetchPublicMarketplace(): Promise<MarketplaceResult> {
  const supabase = getSupabase();

  // For Beta: show all deals (not just visible ones)
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Error fetching public marketplace deals', error);
    return { deals: [], cdes: [], investors: [] };
  }

  const deals: Deal[] = (data || []).map((deal: any) => mapDealFromDB(deal));

  return { deals, cdes: [], investors: [] };
}

/**
 * Fetch pipeline data based on role
 * - Sponsors: Their own deals in various stages
 * - CDEs: Deals they've engaged with (flagged, LOI, committed)
 * - Investors: Deals they've expressed interest in
 */
export async function fetchPipelineForRole(
  orgType: OrgType | undefined,
  orgId?: string
): Promise<Deal[]> {
  const supabase = getSupabase();

  if (!orgId) {
    return [];
  }

  let query = supabase.from('deals').select('*');

  switch (orgType) {
    case 'sponsor':
      // Sponsors see their own deals
      query = query.eq('sponsor_organization_id', orgId);
      break;
    case 'cde':
      // CDEs see deals assigned to them or where they've engaged
      query = query.or(`assigned_cde_id.eq.${orgId},cde_interest.cs.{${orgId}}`);
      break;
    case 'investor':
      // Investors see deals they've expressed interest in
      query = query.or(`investor_id.eq.${orgId},investor_interest.cs.{${orgId}}`);
      break;
    default:
      return [];
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    logger.error(`Error fetching pipeline for ${orgType}`, error);
    return [];
  }

  return (data || []).map((deal: any) => mapDealFromDB(deal));
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
