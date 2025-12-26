import { getSupabase } from '../supabase';
import { Deal as DealCard } from '@/components/DealCard';
import { CDEDealCard } from '@/lib/types/cde';
import { Deal, ProgramType, ProgramLevel, DealStatus, TractType } from '@/lib/data/deals';

/**
 * Fetch all deals from Supabase and map them to the Deal interface from lib/data/deals
 */
export async function fetchDeals(): Promise<Deal[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      organizations:sponsor_id (
        name,
        logo_url,
        website
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals:', error);
    return [];
  }

  return (data || []).map((deal: any) => ({
    id: deal.id,
    projectName: deal.project_name,
    sponsorName: deal.organizations?.name || 'Unknown Sponsor',
    sponsorDescription: deal.project_description,
    website: deal.organizations?.website,
    programType: (deal.programs && deal.programs[0]) as ProgramType || 'NMTC',
    programLevel: (deal.program_level && deal.program_level[0]) as ProgramLevel || 'federal',
    stateProgram: deal.state_program,
    allocation: Number(deal.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: deal.state || '',
    city: deal.city || '',
    tractType: (deal.tract_type || []) as TractType[],
    status: (deal.status === 'draft' ? 'available' : deal.status) as DealStatus,
    description: deal.project_description,
    communityImpact: deal.community_impact,
    projectHighlights: [], // Map if available
    useOfFunds: [], // Map if available
    timeline: [], // Map if available
    foundedYear: 2020,
    submittedDate: deal.created_at,
    povertyRate: Number(deal.tract_poverty_rate) || 0,
    medianIncome: Number(deal.tract_median_income) || 0,
    jobsCreated: deal.jobs_created || 0,
    visible: true,
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
      organizations:sponsor_id (
        name,
        logo_url,
        website
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching deal by ID:', error);
    return null;
  }

  return {
    id: data.id,
    projectName: data.project_name,
    sponsorName: data.organizations?.name || 'Unknown Sponsor',
    sponsorDescription: data.project_description,
    website: data.organizations?.website,
    programType: (data.programs && data.programs[0]) as ProgramType || 'NMTC',
    programLevel: (data.program_level && data.program_level[0]) as ProgramLevel || 'federal',
    stateProgram: data.state_program,
    allocation: Number(data.nmtc_financing_requested) || 0,
    creditPrice: 0.76,
    state: data.state || '',
    city: data.city || '',
    tractType: (data.tract_type || []) as TractType[],
    status: (data.status === 'draft' ? 'available' : data.status) as DealStatus,
    description: data.project_description,
    communityImpact: data.community_impact,
    projectHighlights: [],
    useOfFunds: [],
    timeline: [],
    foundedYear: 2020,
    submittedDate: data.created_at,
    povertyRate: Number(data.tract_poverty_rate) || 0,
    medianIncome: Number(data.tract_median_income) || 0,
    jobsCreated: data.jobs_created || 0,
    visible: true,
  };
}

/**
 * Fetch deals for the marketplace view
 */
export async function fetchMarketplaceDeals(): Promise<Deal[]> {
  return fetchDeals();
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
    console.error('Error fetching CDEs:', error);
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
