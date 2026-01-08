/**
 * Field Mapping Utilities
 * Maps between database fields and standardized field names from documentation
 */

/**
 * Get NMTC allocation amount using standardized field names with fallbacks
 */
export function getNMTCAllocation(deal: any): number {
  return Number(
    deal.fed_nmtc_allocation_request || 
    deal.nmtc_financing_requested || 
    deal.allocation_amount || 
    0
  );
}

/**
 * Get state NMTC allocation amount
 */
export function getStateNMTCAllocation(deal: any): number {
  return Number(
    deal.state_nmtc_allocation_request || 
    deal.state_allocation_amount || 
    0
  );
}

/**
 * Get HTC amount using standardized field names
 */
export function getHTCAmount(deal: any): number {
  return Number(
    deal.project_gross_htc || 
    deal.htc_amount || 
    0
  );
}

/**
 * Get total project cost
 */
export function getTotalProjectCost(deal: any): number {
  return Number(deal.total_project_cost || 0);
}

/**
 * Get financing gap
 */
export function getFinancingGap(deal: any): number {
  return Number(deal.financing_gap || 0);
}

/**
 * Get jobs created using standardized field names
 */
export function getJobsCreated(deal: any): number {
  return Number(
    deal.jobs_created || 
    deal.permanent_jobs_fte || 
    0
  );
}

/**
 * Get affordable housing units
 */
export function getAffordableUnits(deal: any): number {
  return Number(deal.affordable_units || deal.affordable_housing_units || 0);
}

/**
 * Check if project is shovel ready
 */
export function isShovelReady(deal: any): boolean {
  return Boolean(deal.shovel_ready);
}

/**
 * Get census tract from standardized field
 */
export function getCensusTract(deal: any): string {
  return String(deal.census_tract || '');
}

/**
 * Get poverty rate from tract data
 */
export function getPovertyRate(deal: any): number {
  return Number(deal.poverty_rate || deal.tract_poverty_rate || 0);
}

/**
 * Get median income from tract data
 */
export function getMedianIncome(deal: any): number {
  return Number(deal.median_income || deal.tract_median_income || 0);
}

/**
 * Get unemployment rate from tract data
 */
export function getUnemploymentRate(deal: any): number {
  return Number(deal.unemployment_rate || deal.tract_unemployment || 0);
}

/**
 * Map deal record to standardized format
 */
export function mapDealToStandardized(deal: any) {
  return {
    ...deal,
    // Standardized financial fields
    fed_nmtc_allocation_request: getNMTCAllocation(deal),
    state_nmtc_allocation_request: getStateNMTCAllocation(deal),
    project_gross_htc: getHTCAmount(deal),
    total_project_cost: getTotalProjectCost(deal),
    financing_gap: getFinancingGap(deal),
    jobs_created: getJobsCreated(deal),
    affordable_units: getAffordableUnits(deal),
    
    // Standardized tract fields
    census_tract: getCensusTract(deal),
    poverty_rate: getPovertyRate(deal),
    median_income: getMedianIncome(deal),
    unemployment_rate: getUnemploymentRate(deal),
    
    // Standardized boolean fields
    shovel_ready: isShovelReady(deal),
  };
}

/**
 * Field mapping for intake form to database
 */
export const INTAKE_TO_DB_MAPPING = {
  // Project basics
  projectName: 'project_name',
  projectDescription: 'project_description',
  communityImpact: 'community_impact',
  sponsorName: 'sponsor_name',
  
  // Location
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zip_code',
  censusTract: 'census_tract',
  
  // Tract data
  povertyRate: 'poverty_rate',
  medianIncome: 'median_income',
  unemploymentRate: 'unemployment_rate',
  
  // Financial
  totalProjectCost: 'total_project_cost',
  fedNMTCAllocationRequest: 'fed_nmtc_allocation_request',
  stateNMTCAllocationRequest: 'state_nmtc_allocation_request',
  projectGrossHTC: 'project_gross_htc',
  financingGap: 'financing_gap',
  
  // Impact
  jobsCreated: 'jobs_created',
  affordableUnits: 'affordable_units',
  affordabilityLevels: 'affordability_levels',
  compliancePeriodYears: 'compliance_period_years',
  
  // Readiness
  shovelReady: 'shovel_ready',
  projectedCompletionDate: 'projected_completion_date',
  
  // Sources and uses
  sourcesJson: 'sources_json',
  totalSources: 'total_sources',
  usesJson: 'uses_json',
  totalUses: 'total_uses',
} as const;

/**
 * Map intake form data to database format
 */
export function mapIntakeToDatabase(intakeData: any) {
  const mapped: any = {};
  
  for (const [intakeField, dbField] of Object.entries(INTAKE_TO_DB_MAPPING)) {
    if (intakeData[intakeField] !== undefined) {
      mapped[dbField] = intakeData[intakeField];
    }
  }
  
  return mapped;
}