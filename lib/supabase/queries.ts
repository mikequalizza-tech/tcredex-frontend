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
    .select(`
      *,
      organizations:sponsor_organization_id (
        name,
        logo_url,
        website
      )
    `);

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
    sponsorName: deal.organizations?.name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.organizations?.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: Number(deal.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    tractType: (deal.tract_types || []) as TractType[],
    status: (deal.status === 'draft' ? 'available' : deal.status) as DealStatus,
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
  
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      organizations:sponsor_organization_id (
        name,
        logo_url,
        website
      )
    `)
    .eq('id', id)
    .single();

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
    sponsorName: data.organizations?.name || data.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: data.project_description,
    website: data.organizations?.website,
    programType: (data.programs && data.programs[0]) as ProgramType || 'NMTC',
    programLevel: (data.program_level) as ProgramLevel || 'federal',
    stateProgram: data.state_program,
    allocation: Number(data.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: data.state || '',
    city: data.city || '',
    tractType: (data.tract_types || []) as TractType[],
    status: (data.status === 'draft' ? 'available' : data.status) as DealStatus,
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
 * Fetch deals for a specific organization
 */
export async function fetchDealsByOrganization(orgId: string): Promise<Deal[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      organizations:sponsor_organization_id (
        name,
        logo_url,
        website
      )
    `)
    .or(`sponsor_organization_id.eq.${orgId},assigned_cde_id.eq.${orgId},investor_id.eq.${orgId}`);

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
    sponsorName: deal.organizations?.name || deal.sponsor_name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.organizations?.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: Number(deal.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    tractType: (deal.tract_types || []) as TractType[],
    status: (deal.status === 'draft' ? 'available' : deal.status) as DealStatus,
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
