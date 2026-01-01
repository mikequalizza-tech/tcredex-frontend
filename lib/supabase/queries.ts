import { getSupabase } from '../supabase';
import { CDEDealCard } from '@/lib/types/cde';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';
import { logger } from '@/lib/utils/logger';

/**
 * Fetch all deals from Supabase and map them to the Deal interface from lib/data/deals
 */
export async function fetchDeals(onlyVisible: boolean = false): Promise<Deal[]> {
  const supabase = getSupabase();
  
  let query = supabase
    .from('deals')
    .select('*');

  if (onlyVisible) {
    query = query.eq('visible', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    // Suppress recursion errors during build
    const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    const isRecursion = error.message?.toLowerCase().includes('recursion');
    
    if (!isBuild || !isRecursion) {
      logger.error('Error fetching deals', error);
    }
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
  }));
}

/**
 * Fetch a single deal by ID
 */
export async function fetchDealById(id: string): Promise<Deal | null> {
  const supabase = getSupabase();

  const { data: rawData, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as Record<string, any> | null;

  if (error || !data) {
    const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    const isRecursion = error?.message?.toLowerCase().includes('recursion');

    if (!isBuild || (error && !isRecursion)) {
      logger.error('Error fetching deal by ID', error);
    }
    return null;
  }

  return {
    id: data.id,
    projectName: data.project_name,
    sponsorName: data.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: data.project_description,
    website: data.website,
    programType: (data.programs && data.programs[0]) as ProgramType || 'NMTC',
    programLevel: (data.program_level) as ProgramLevel || 'federal',
    stateProgram: data.state_program,
    allocation: Number(data.nmtc_financing_requested) || 0,
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
}

/**
 * Fetch deals for the marketplace view
 */
export async function fetchMarketplaceDeals(): Promise<Deal[]> {
  return fetchDeals(true);
}

/**
 * Fetch deals for a specific organization or user
 * Also includes deals where the intake_data contains matching organization or user info
 */
export async function fetchDealsByOrganization(orgId: string, userEmail?: string): Promise<Deal[]> {
  const supabase = getSupabase();

  // If orgId is empty/undefined, just fetch all deals
  if (!orgId || orgId === 'undefined' || orgId === 'null') {
    logger.info('fetchDealsByOrganization: No valid orgId, fetching all deals');
    return fetchDeals();
  }

  // Build the OR conditions for organization matching
  const orConditions = `sponsor_organization_id.eq.${orgId},assigned_cde_id.eq.${orgId},investor_id.eq.${orgId}`;

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .or(orConditions)
    .order('created_at', { ascending: false });

  if (error) {
    const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    const isRecursion = error.message?.toLowerCase().includes('recursion');
    
    if (!isBuild || !isRecursion) {
      logger.error('Error fetching deals by organization', error);
    }
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
  }));
}

/**
 * Fetch all CDEs from Supabase and map them to the CDEDealCard interface
 */
export async function fetchCDEs(): Promise<CDEDealCard[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('cdes')
    .select(`
      *,
      organizations:organization_id (
        name
      )
    `)
    .eq('status', 'active');

  if (error) {
    const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
    const isRecursion = error.message?.toLowerCase().includes('recursion');
    
    if (!isBuild || !isRecursion) {
      logger.error('Error fetching CDEs', error);
    }
    return [];
  }

  return (data || []).map((cde: any) => ({
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
      max: Number(cde.max_deal_size) || 0
    },
    ruralFocus: cde.rural_focus || false,
    urbanFocus: cde.urban_focus || false,
    requireSeverelyDistressed: cde.require_severely_distressed || false,
    htcExperience: cde.htc_experience || false,
    smallDealFund: cde.small_deal_fund || false,
    status: 'active',
    lastUpdated: cde.updated_at || '',
  }));
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
 * Fetch a single CDE by slug
 */
export async function fetchCDEBySlug(slug: string): Promise<CDEDetail | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('cdes')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug,
        website
      )
    `)
    .eq('organizations.slug', slug)
    .single();

  if (error || !data) {
    // Try by CDE id as fallback
    const { data: byId, error: byIdError } = await supabase
      .from('cdes')
      .select(`
        *,
        organizations:organization_id (
          name,
          slug,
          website
        )
      `)
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
    name: cde.organizations?.name || 'Unknown CDE',
    slug: cde.organizations?.slug || cde.id,
    description: cde.mission_statement || '',
    headquartersCity: cde.headquarters_city || '',
    headquartersState: cde.headquarters_state || '',
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
    website: cde.organizations?.website || '',
    primaryContact: cde.contact_name || '',
    contactEmail: cde.contact_email || '',
    contactPhone: cde.contact_phone || '',
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
 * Fetch a single investor by slug
 */
export async function fetchInvestorBySlug(slug: string): Promise<InvestorDetail | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('investors')
    .select(`
      *,
      organizations:organization_id (
        name,
        slug,
        website
      )
    `)
    .eq('organizations.slug', slug)
    .single();

  if (error || !data) {
    // Try by investor id as fallback
    const { data: byId, error: byIdError } = await supabase
      .from('investors')
      .select(`
        *,
        organizations:organization_id (
          name,
          slug,
          website
        )
      `)
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
    name: investor.organizations?.name || 'Unknown Investor',
    slug: investor.organizations?.slug || investor.id,
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
    website: investor.organizations?.website || '',
    primaryContact: investor.contact_name || '',
    contactEmail: investor.contact_email || '',
    contactPhone: investor.contact_phone || '',
  };
}
