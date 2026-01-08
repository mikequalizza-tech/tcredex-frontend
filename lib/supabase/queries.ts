import { getSupabase } from '../supabase';
import { CDEDealCard } from '@/lib/types/cde';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';
import { logger } from '@/lib/utils/logger';
import { getNMTCAllocation } from '@/lib/utils/fieldMapping';

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

  return (data || []).map((deal: any) => {
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
}

/**
 * Fetch a single deal by ID
 */
export async function fetchDealById(id: string): Promise<Deal | null> {
  try {
<<<<<<< HEAD
    const res = await fetch(`/api/deals?id=${encodeURIComponent(id)}`, { credentials: 'include' });
=======
    const res = await fetch(`/api/deals?id=${encodeURIComponent(id)}`);
>>>>>>> origin/main
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      logger.error('Error fetching deal by ID', data.error || res.statusText);
      return null;
    }
    const json = await res.json();
    const data = json.deal as Record<string, any> | null;
    if (!data) return null;

    return {
      id: data.id,
      projectName: data.project_name,
      sponsorName: data.sponsor_name || 'Unknown Sponsor',
      sponsorOrganizationId: data.sponsor_organization_id,
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

  // If orgId is empty/undefined, return empty array (user has no deals yet)
  if (!orgId || orgId === 'undefined' || orgId === 'null') {
    logger.info('fetchDealsByOrganization: No valid orgId, returning empty');
    return [];
  }

  try {
    // First, determine what type of organization this is and get the relevant record IDs
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', orgId)
      .single();

    if (orgError || !orgData) {
      logger.error('Error fetching organization type', orgError);
      return [];
    }

    let orConditions = '';

    // Build conditions based on organization type
    if ((orgData as any).type === 'sponsor') {
      // For sponsors, use the organization_id directly
      orConditions = `sponsor_organization_id.eq.${orgId}`;
    } else if ((orgData as any).type === 'cde') {
      // For CDEs, find the CDE record and use its ID
      const { data: cdeData } = await supabase
        .from('cdes')
        .select('id')
        .eq('organization_id', orgId)
        .single();
      
      if (cdeData) {
        orConditions = `assigned_cde_id.eq.${(cdeData as any).id}`;
      } else {
        // No CDE record found, return empty
        logger.info('No CDE record found for organization', orgId);
        return [];
      }
    } else if ((orgData as any).type === 'investor') {
      // For investors, find the investor record and use its ID
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('organization_id', orgId)
        .single();
      
      if (investorData) {
        orConditions = `investor_id.eq.${(investorData as any).id}`;
      } else {
        // No investor record found, return empty
        logger.info('No investor record found for organization', orgId);
        return [];
      }
    } else {
      // Unknown organization type, return empty
      logger.info('Unknown organization type', (orgData as any).type);
      return [];
    }

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

    logger.info(`Found ${data?.length || 0} deals for ${(orgData as any).type} organization ${orgId}`);
    return (data || []).map((deal: any) => ({
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
        : Number(deal.nmtc_financing_requested) || 0,
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
  } catch (error) {
    logger.error('Error in fetchDealsByOrganization', error);
    return [];
  }
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

// =============================================================================
// CDE ALLOCATION QUERIES
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
 */
export async function fetchCDEAllocations(cdeOrgId: string): Promise<CDEAllocation[]> {
  const supabase = getSupabase();

  try {
    // First get the CDE record for this organization
    const { data: cdeRaw, error: cdeError } = await supabase
      .from('cdes')
      .select('id')
      .eq('organization_id', cdeOrgId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cdeData = cdeRaw as Record<string, any> | null;

    if (cdeError || !cdeData) {
      logger.error('Error finding CDE for organization', cdeError);
      return [];
    }

    // Now fetch allocations for this CDE
    const { data: rawData, error } = await supabase
      .from('cde_allocations')
      .select('*')
      .eq('cde_id', cdeData.id)
      .order('year', { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawData as Record<string, any>[] | null;

    if (error) {
      logger.error('Error fetching CDE allocations', error);
      return [];
    }

    return (data || []).map((alloc) => ({
      id: alloc.id,
      cdeId: alloc.cde_id,
      type: alloc.type as 'federal' | 'state',
      year: alloc.year,
      stateCode: alloc.state_code,
      awardedAmount: Number(alloc.awarded_amount) || 0,
      availableOnPlatform: Number(alloc.available_on_platform) || 0,
      deployedAmount: Number(alloc.deployed_amount) || 0,
      percentageWon: alloc.percentage_won ? Number(alloc.percentage_won) : undefined,
      deploymentDeadline: alloc.deployment_deadline,
      notes: alloc.notes,
      createdAt: alloc.created_at,
      updatedAt: alloc.updated_at,
    }));
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
  const supabase = getSupabase();

  try {
    const { data: rawData, error } = await supabase
      .from('cdes')
      .select('*')
      .eq('organization_id', cdeOrgId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const supabase = getSupabase();

  // Get CDE record
  const { data: cdeRaw } = await supabase
    .from('cdes')
    .select('id')
    .eq('organization_id', cdeOrgId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
