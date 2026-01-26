/**
 * Supabase Query Functions
 * SIMPLIFIED: Uses simplified schema tables (sponsors, investors, users, cdes_merged) - no organization FK joins
 */

import { getSupabase, getSupabaseAdmin } from '../supabase';
import { CDEDealCard } from '@/lib/types/cde';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';
import { logger } from '@/lib/utils/logger';
import { getNMTCAllocation } from '@/lib/utils/fieldMapping';
import { getBackendApiUrl } from '../config/env-validation';
import { fetchBackend, fetchApi } from '../api/fetch-utils';

/**
 * Helper function to map allocation based on program type
 */
function mapAllocationByProgram(deal: any, programType: ProgramType): number {
  switch (programType) {
    case 'LIHTC':
      return Number(deal.project_gross_htc) || Number(deal.htc_amount) || Number(deal.lihtc_basis) || Number(deal.total_project_cost) || 0;
    case 'HTC':
      return Number(deal.project_gross_htc) || Number(deal.htc_amount) || 0;
    case 'NMTC':
      return Number(deal.nmtc_financing_requested) || Number(deal.fed_nmtc_allocation_request) || 0;
    case 'OZ':
      return Number(deal.oz_investment) || Number(deal.total_project_cost) || 0;
    default:
      return Number(deal.nmtc_financing_requested) || 0;
  }
}

/**
 * Fetch all deals - uses backend API for reliability
 */
export async function fetchDeals(onlyVisible: boolean = false): Promise<Deal[]> {
  // Use backend API instead of direct Supabase call
  try {
    const params = onlyVisible ? '?visible=true' : '';
    const url = `/api/deals${params}`;
    const result = await fetchApi<{ deals?: Deal[]; data?: { deals?: Deal[] } }>(url);

    if (!result.success || !result.data) {
      return [];
    }

    const data = result.data.data?.deals || result.data.deals || (Array.isArray(result.data) ? result.data : []);

    return data.map((deal: any) => {
      const programType = (deal.programs && deal.programs[0]) as ProgramType || 'NMTC';
      return {
        id: deal.id,
        projectName: deal.project_name,
        sponsorName: deal.sponsor_name || 'Unknown Sponsor',
        sponsorDescription: deal.project_description,
        website: deal.website,
        programType,
        programLevel: (deal.program_level) as ProgramLevel || 'federal',
        stateProgram: deal.state_program,
        allocation: mapAllocationByProgram(deal, programType),
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
    });
  } catch (error) {
    logger.error('Error fetching deals', { 
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    return [];
  }
}

/**
 * Fetch a single deal by ID
 */
export async function fetchDealById(id: string): Promise<Deal | null> {
  try {
    const result = await fetchApi<{ deal?: Record<string, any> }>(`/api/deals?id=${encodeURIComponent(id)}`);
    
    if (!result.success || !result.data) {
      return null;
    }

    const data = result.data.deal as Record<string, any> | null;
    if (!data) return null;

    // Get sponsor organization_id via join if available
    const sponsorOrgId = (data as any).sponsors?.organization_id || 
                         (data as any).sponsor_organization_id || 
                         null;

    return {
      id: data.id,
      projectName: data.project_name,
      sponsorName: data.sponsor_name || 'Unknown Sponsor',
      sponsorOrganizationId: sponsorOrgId,
      sponsorDescription: data.project_description,
      website: data.website,
      programType: (data.programs && data.programs[0]) as ProgramType || 'NMTC',
      programLevel: (data.program_level) as ProgramLevel || 'federal',
      stateProgram: data.state_program,
      allocation: mapAllocationByProgram(data, (data.programs && data.programs[0]) as ProgramType || 'NMTC'),
      creditPrice: 0.76,
      state: data.state || '',
      city: data.city || '',
      tractType: (data.tract_types || []) as TractType[],
      status: (data.status || 'draft') as DealStatus,
      description: data.project_description,
      communityImpact: data.community_benefit,
      projectHighlights: [],
      useOfFunds: data.total_project_cost ? [
        { category: 'Construction', amount: Number(data.construction_cost) || 0 },
        { category: 'Acquisition', amount: Number(data.acquisition_cost) || 0 },
        { category: 'Soft Costs', amount: Number(data.soft_costs) || 0 },
      ].filter(item => item.amount > 0) : [],
      timeline: [
        { milestone: 'Construction Start', date: data.construction_start_date || 'TBD', completed: !!data.construction_start_date },
        { milestone: 'Projected Completion', date: data.projected_completion_date || 'TBD', completed: false },
      ].filter(item => item.date !== 'TBD'),
      foundedYear: 2020,
      submittedDate: data.created_at,
      povertyRate: Number(data.tract_poverty_rate) || 0,
      medianIncome: Number(data.tract_median_income) || 0,
      jobsCreated: data.jobs_created || 0,
      visible: data.visible ?? true,
      coordinates: data.latitude && data.longitude ? [data.longitude, data.latitude] : undefined,
      projectCost: Number(data.total_project_cost) || 0,
      financingGap: Number(data.financing_gap) || 0,
      censusTract: data.census_tract,
      unemployment: Number(data.tract_unemployment) || 0,
    };
  } catch (error) {
    logger.error('Error in fetchDealById', error);
    return null;
  }
}

/**
 * Fetch deals for the marketplace view (public, uses API route)
 */
export async function fetchMarketplaceDeals(): Promise<Deal[]> {
  try {
    const result = await fetchApi<{ deals?: Deal[] }>('/api/deals/marketplace');
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.deals || [];
  } catch (error) {
    logger.error('Error fetching marketplace deals', error);
    return [];
  }
}

/**
 * Fetch deals for a specific organization or user
 * Uses API route to avoid RLS issues on client side
 */
export async function fetchDealsByOrganization(orgId: string, userEmail?: string): Promise<Deal[]> {
  // If orgId is empty/undefined, return empty array (user has no deals yet)
  if (!orgId || orgId === 'undefined' || orgId === 'null') {
    logger.info('fetchDealsByOrganization: No valid orgId, returning empty');
    return [];
  }

  try {
    // Use API route which runs on server with admin privileges
    const url = `/api/deals/by-organization?orgId=${encodeURIComponent(orgId)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
    const result = await fetchApi<{ deals?: Deal[] }>(url);

    if (!result.success || !result.data) {
      return [];
    }

    const data = result.data.deals || [];

    logger.info(`Found ${data.length} deals for organization ${orgId}`);
    return data.map((deal: any) => {
      // Determine completion date
      const completionDate = deal.projected_completion_date || 
                            deal.estimated_completion || 
                            deal.completion_date;

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
        allocation: deal.programType === 'LIHTC'
          ? Number(deal.project_gross_htc) || Number(deal.htc_amount) || 0
          : deal.programType === 'HTC'
          ? Number(deal.project_gross_htc) || Number(deal.htc_amount) || 0
          : Number(deal.nmtc_financing_requested || deal.nmtc_request) || 0,
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
    });
  } catch (error) {
    logger.error('Error in fetchDealsByOrganization', error);
    return [];
  }
}

/**
 * Fetch all CDEs - uses backend API for reliability
 * Returns CDE organizations from the cdes_merged table
 */
export async function fetchCDEs(): Promise<CDEDealCard[]> {
  // Use frontend API route which handles auth and calls backend if needed
  try {
    const result = await fetchApi<{ cdes?: CDEDealCard[]; data?: { cdes?: CDEDealCard[] } }>('/api/cdes');

    if (!result.success || !result.data) {
      return [];
    }

    const data = result.data.data?.cdes || result.data.cdes || (Array.isArray(result.data) ? result.data : []);

    // Map CDE data to CDEDealCard format
    // API returns normalized format from /api/cdes route
    return data.map((cde: any) => {
      // Handle both API response format and direct database format
      const orgId = cde.organization_id || cde.organizationId;
      const name = cde.name || cde.organization_name || 'Unknown CDE';
      const remainingAlloc = cde.remaining_allocation || cde.amount_remaining || 0;
      const serviceArea = cde.service_area || cde.serviceArea || '';
      const predominantMarket = cde.predominant_market || cde.predominantMarket || '';
      
      return {
        id: cde.id,
        organizationId: orgId,
        organizationName: name,
        missionSnippet: cde.mission_statement || cde.description || '',
        remainingAllocation: Number(remainingAlloc) || 0,
        allocationDeadline: cde.deployment_deadline || '',
        primaryStates: Array.isArray(cde.primary_states) ? cde.primary_states : (cde.state ? [cde.state] : []),
        targetSectors: Array.isArray(cde.target_sectors) ? cde.target_sectors : [],
        impactPriorities: Array.isArray(cde.impact_priorities) ? cde.impact_priorities : [],
        serviceArea: serviceArea,
        predominantMarket: predominantMarket,
        dealSizeRange: {
          min: Number(cde.min_deal_size) || 0,
          max: Number(cde.max_deal_size) || 0
        },
        ruralFocus: Boolean(cde.rural_focus),
        urbanFocus: Boolean(cde.urban_focus ?? true), // Default to true if not specified
        requireSeverelyDistressed: Boolean(cde.require_severely_distressed),
        htcExperience: Boolean(cde.htc_experience),
        smallDealFund: Boolean(cde.small_deal_fund),
        status: cde.status || 'active',
        lastUpdated: cde.updated_at || cde.created_at || '',
        // Extra fields
        website: cde.website || '',
        city: cde.city || '',
        state: cde.state || '',
        contactName: cde.primary_contact_name || cde.contact_name || '',
        contactEmail: cde.primary_contact_email || cde.contact_email || '',
      };
    });
  } catch (error) {
    logger.error('Error fetching CDEs', { 
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    return [];
  }
}

/**
 * CDE detail interface for profile pages
 */
export interface CDEDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  headquartersCity: string;
  headquartersState: string;
  missionFocus: string[];
  projectTypes: string[];
  serviceArea: string[];
  serviceAreaType: string;
  availableAllocation: number;
  totalAllocation: number;
  allocationYear: string;
  minDealSize: number;
  maxDealSize: number;
  projectsClosed: number;
  totalDeployed: number;
  avgDealSize: number;
  responseTime: string;
  acceptingApplications: boolean;
  website: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
}

/**
 * Fetch a single CDE by slug - uses cdes_merged table
 */
export async function fetchCDEBySlug(slug: string): Promise<CDEDetail | null> {
  const supabase = getSupabaseAdmin();

  // Try to find by slug first
  const { data, error } = await supabase
    .from('cdes_merged')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    // Try by CDE id as fallback
    const { data: byId, error: byIdError } = await supabase
      .from('cdes_merged')
      .select('*')
      .eq('id', slug)
      .single();

    if (byIdError || !byId) {
      return null;
    }

    return mapCDEToDetail(byId);
  }

  return mapCDEToDetail(data);
}

function mapCDEToDetail(cde: any): CDEDetail {
  return {
    id: cde.id,
    name: cde.name || 'Unknown CDE',
    slug: cde.slug || cde.id,
    description: cde.mission_statement || '',
    headquartersCity: cde.headquarters_city || cde.city || '',
    headquartersState: cde.headquarters_state || cde.state || '',
    missionFocus: cde.impact_priorities || [],
    projectTypes: cde.target_sectors || [],
    serviceArea: cde.primary_states || [],
    serviceAreaType: cde.service_area_type || 'Regional',
    availableAllocation: Number(cde.remaining_allocation) || 0,
    totalAllocation: Number(cde.total_allocation) || 0,
    allocationYear: cde.allocation_year || new Date().getFullYear().toString(),
    minDealSize: Number(cde.min_deal_size) || 0,
    maxDealSize: Number(cde.max_deal_size) || 0,
    projectsClosed: Number(cde.projects_closed) || 0,
    totalDeployed: Number(cde.total_deployed) || 0,
    avgDealSize: Number(cde.avg_deal_size) || 0,
    responseTime: cde.response_time || '2-3 weeks',
    acceptingApplications: cde.status === 'active',
    website: cde.website || '',
    primaryContact: cde.primary_contact_name || '',
    contactEmail: cde.primary_contact_email || '',
    contactPhone: cde.primary_contact_phone || '',
  };
}

/**
 * Investor detail interface for profile pages
 */
export interface InvestorDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  investorType: string;
  programs: string[];
  projectPreferences: string[];
  geographicFocus: string[];
  focusType: string;
  availableCapital: number;
  totalCapital: number;
  minInvestment: number;
  maxInvestment: number;
  dealsCompleted: number;
  totalInvested: number;
  avgDealSize: number;
  targetReturn: string;
  responseTime: string;
  activelyInvesting: boolean;
  requiresCDE: boolean;
  directInvestment: boolean;
  website: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
}

/**
 * Fetch a single investor by slug - uses investors table
 */
export async function fetchInvestorBySlug(slug: string): Promise<InvestorDetail | null> {
  const supabase = getSupabaseAdmin();

  // Try to find by slug first
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    // Try by investor id as fallback
    const { data: byId, error: byIdError } = await supabase
      .from('investors')
      .select('*')
      .eq('id', slug)
      .single();

    if (byIdError || !byId) {
      return null;
    }

    return mapInvestorToDetail(byId);
  }

  return mapInvestorToDetail(data);
}

function mapInvestorToDetail(investor: any): InvestorDetail {
  return {
    id: investor.id,
    name: investor.name || 'Unknown Investor',
    slug: investor.slug || investor.id,
    description: investor.investment_thesis || '',
    investorType: investor.investor_type || 'institutional',
    programs: investor.programs || ['NMTC'],
    projectPreferences: investor.project_preferences || [],
    geographicFocus: investor.geographic_focus || [],
    focusType: investor.focus_type || 'National',
    availableCapital: Number(investor.available_capital) || 0,
    totalCapital: Number(investor.total_capital) || 0,
    minInvestment: Number(investor.min_investment) || 0,
    maxInvestment: Number(investor.max_investment) || 0,
    dealsCompleted: Number(investor.deals_completed) || 0,
    totalInvested: Number(investor.total_invested) || 0,
    avgDealSize: Number(investor.avg_deal_size) || 0,
    targetReturn: investor.target_return || 'Market Rate',
    responseTime: investor.response_time || '1-2 weeks',
    activelyInvesting: investor.status === 'active',
    requiresCDE: investor.requires_cde ?? true,
    directInvestment: investor.direct_investment ?? false,
    website: investor.website || '',
    primaryContact: investor.primary_contact_name || '',
    contactEmail: investor.primary_contact_email || '',
    contactPhone: investor.primary_contact_phone || '',
  };
}

// =============================================================================
// CDE ALLOCATION QUERIES - Now uses cdes_merged with embedded allocation data
// =============================================================================

/**
 * CDE Allocation interface
 */
export interface CDEAllocation {
  id: string;
  cdeId: string;
  type: 'federal' | 'state';
  year: string;
  stateCode?: string;
  awardedAmount: number;
  availableOnPlatform: number;
  deployedAmount: number;
  percentageWon?: number;
  deploymentDeadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all allocations for a specific CDE organization
 * Now uses cdes_merged which has allocation data embedded
 */
export async function fetchCDEAllocations(cdeOrgId: string): Promise<CDEAllocation[]> {
  const supabase = getSupabaseAdmin();

  try {
    // Get the CDE record from cdes_merged
    const { data: cdeData, error: cdeError } = await supabase
      .from('cdes_merged')
      .select('*')
      .eq('organization_id', cdeOrgId)
      .single();

    if (cdeError || !cdeData) {
      logger.error('Error finding CDE for organization', cdeError);
      return [];
    }

    // cdes_merged has allocation data embedded - return as single allocation
    const cde = cdeData as Record<string, any>;
    if (!cde.remaining_allocation && !cde.total_allocation) {
      return [];
    }

    return [{
      id: cde.id,
      cdeId: cde.id,
      type: 'federal',
      year: cde.allocation_year || new Date().getFullYear().toString(),
      awardedAmount: Number(cde.total_allocation) || 0,
      availableOnPlatform: Number(cde.remaining_allocation) || 0,
      deployedAmount: (Number(cde.total_allocation) || 0) - (Number(cde.remaining_allocation) || 0),
      deploymentDeadline: cde.deployment_deadline,
      createdAt: cde.created_at,
      updatedAt: cde.updated_at,
    }];
  } catch (error) {
    logger.error('Error in fetchCDEAllocations', error);
    return [];
  }
}

/**
 * Fetch CDE investment criteria
 */
export interface CDEInvestmentCriteria {
  id: string;
  primaryStates: string[];
  minDealSize: number;
  maxDealSize: number;
  targetSectors: string[];
  impactPriorities: string[];
  ruralFocus: boolean;
  urbanFocus: boolean;
  requireSeverelyDistressed: boolean;
  minJobsPerMillion?: number;
}

export async function fetchCDECriteria(cdeOrgId: string): Promise<CDEInvestmentCriteria | null> {
  const supabase = getSupabaseAdmin();

  try {
    const { data: rawData, error } = await supabase
      .from('cdes_merged')
      .select('*')
      .eq('organization_id', cdeOrgId)
      .single();

    const data = rawData as Record<string, any> | null;

    if (error || !data) {
      logger.error('Error fetching CDE criteria', error);
      return null;
    }

    return {
      id: data.id,
      primaryStates: data.primary_states || [],
      minDealSize: Number(data.min_deal_size) || 0,
      maxDealSize: Number(data.max_deal_size) || 0,
      targetSectors: data.target_sectors || [],
      impactPriorities: data.impact_priorities || [],
      ruralFocus: data.rural_focus || false,
      urbanFocus: data.urban_focus || false,
      requireSeverelyDistressed: data.require_severely_distressed || false,
      minJobsPerMillion: data.min_jobs_per_million ? Number(data.min_jobs_per_million) : undefined,
    };
  } catch (error) {
    logger.error('Error in fetchCDECriteria', error);
    return null;
  }
}

/**
 * Fetch deals in CDE's pipeline (matched/interested deals)
 */
export async function fetchCDEPipelineDeals(cdeOrgId: string): Promise<Deal[]> {
  const supabase = getSupabaseAdmin();

  // Get CDE record from cdes_merged
  const { data: cdeRaw } = await supabase
    .from('cdes_merged')
    .select('id')
    .eq('organization_id', cdeOrgId)
    .single();

  const cdeData = cdeRaw as Record<string, any> | null;

  if (!cdeData) return [];

  // Fetch deals assigned to this CDE or where CDE has expressed interest
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .or(`assigned_cde_id.eq.${cdeData.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching CDE pipeline deals', error);
    return [];
  }

  return (data || []).map((deal: any) => ({
    id: deal.id,
    projectName: deal.project_name,
    sponsorName: deal.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: mapAllocationByProgram(deal, (deal.programs && deal.programs[0]) as ProgramType || 'NMTC'),
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    tractType: (deal.tract_types || []) as TractType[],
    status: (deal.status || 'draft') as DealStatus,
    description: deal.project_description,
    communityImpact: deal.community_benefit,
    projectHighlights: [],
    useOfFunds: [],
    timeline: [],
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
  }));
}
