// CDE (Community Development Entity) Demo Data
// CDEs are the allocators for NMTC - Sponsors need them to access allocation

export interface CDE {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  
  // Allocation info
  totalAllocation: number;      // Total NMTC allocation received
  availableAllocation: number;  // Currently available for deployment
  allocationYear: number;       // Most recent allocation round
  
  // Service area
  serviceArea: string[];        // States they serve
  serviceAreaType: 'national' | 'regional' | 'state' | 'local';
  headquartersCity: string;
  headquartersState: string;
  
  // Focus areas
  missionFocus: MissionFocus[];
  projectTypes: ProjectType[];
  minDealSize: number;
  maxDealSize: number;
  
  // Track record
  projectsClosed: number;
  totalDeployed: number;
  avgDealSize: number;
  
  // Contact
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  
  // Status
  acceptingApplications: boolean;
  responseTime: 'fast' | 'standard' | 'slow'; // <2 weeks, 2-4 weeks, >4 weeks
}

export type MissionFocus = 
  | 'healthcare'
  | 'education'
  | 'manufacturing'
  | 'retail'
  | 'mixed_use'
  | 'community_facilities'
  | 'childcare'
  | 'affordable_housing'
  | 'food_access'
  | 'renewable_energy'
  | 'rural'
  | 'native_american';

export type ProjectType = 
  | 'new_construction'
  | 'rehabilitation'
  | 'expansion'
  | 'equipment'
  | 'working_capital';

export const MISSION_LABELS: Record<MissionFocus, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  mixed_use: 'Mixed Use',
  community_facilities: 'Community Facilities',
  childcare: 'Childcare',
  affordable_housing: 'Affordable Housing',
  food_access: 'Food Access / Grocery',
  renewable_energy: 'Renewable Energy',
  rural: 'Rural Development',
  native_american: 'Native American',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  new_construction: 'New Construction',
  rehabilitation: 'Rehabilitation',
  expansion: 'Expansion',
  equipment: 'Equipment',
  working_capital: 'Working Capital',
};

export const DEMO_CDES: CDE[] = [
  {
    id: 'cde-001',
    name: 'Midwest Community Development',
    slug: 'midwest-community',
    description: 'Regional CDE focused on community facilities and healthcare projects across the Midwest. Strong track record in rural and underserved urban areas.',
    totalAllocation: 75000000,
    availableAllocation: 28000000,
    allocationYear: 2024,
    serviceArea: ['IL', 'IN', 'OH', 'MI', 'WI', 'MN', 'IA', 'MO'],
    serviceAreaType: 'regional',
    headquartersCity: 'Chicago',
    headquartersState: 'IL',
    missionFocus: ['healthcare', 'community_facilities', 'food_access', 'childcare'],
    projectTypes: ['new_construction', 'rehabilitation', 'expansion'],
    minDealSize: 2000000,
    maxDealSize: 15000000,
    projectsClosed: 47,
    totalDeployed: 312000000,
    avgDealSize: 6600000,
    primaryContact: 'Sarah Chen',
    contactEmail: 'schen@midwestcde.org',
    contactPhone: '312-555-0100',
    website: 'https://midwestcde.org',
    acceptingApplications: true,
    responseTime: 'fast',
  },
  {
    id: 'cde-002',
    name: 'National Urban Development Fund',
    slug: 'nudf',
    description: 'National CDE specializing in urban revitalization, mixed-use development, and manufacturing facilities in distressed census tracts.',
    totalAllocation: 150000000,
    availableAllocation: 45000000,
    allocationYear: 2024,
    serviceArea: ['ALL'],
    serviceAreaType: 'national',
    headquartersCity: 'New York',
    headquartersState: 'NY',
    missionFocus: ['manufacturing', 'mixed_use', 'community_facilities'],
    projectTypes: ['new_construction', 'rehabilitation'],
    minDealSize: 5000000,
    maxDealSize: 30000000,
    projectsClosed: 89,
    totalDeployed: 890000000,
    avgDealSize: 10000000,
    primaryContact: 'Marcus Williams',
    contactEmail: 'mwilliams@nudf.org',
    contactPhone: '212-555-0200',
    website: 'https://nudf.org',
    acceptingApplications: true,
    responseTime: 'standard',
  },
  {
    id: 'cde-003',
    name: 'Rural America CDE',
    slug: 'rural-america',
    description: 'Dedicated to serving rural communities across America with focus on healthcare, education, and essential services.',
    totalAllocation: 55000000,
    availableAllocation: 22000000,
    allocationYear: 2023,
    serviceArea: ['ALL'],
    serviceAreaType: 'national',
    headquartersCity: 'Des Moines',
    headquartersState: 'IA',
    missionFocus: ['rural', 'healthcare', 'education', 'food_access'],
    projectTypes: ['new_construction', 'rehabilitation', 'equipment'],
    minDealSize: 1000000,
    maxDealSize: 10000000,
    projectsClosed: 62,
    totalDeployed: 245000000,
    avgDealSize: 3950000,
    primaryContact: 'Jennifer Adams',
    contactEmail: 'jadams@ruralamerica.org',
    contactPhone: '515-555-0300',
    website: 'https://ruralamerica.org',
    acceptingApplications: true,
    responseTime: 'fast',
  },
  {
    id: 'cde-004',
    name: 'Texas Community Capital',
    slug: 'texas-community',
    description: 'State-focused CDE serving Texas communities with emphasis on healthcare, childcare, and manufacturing job creation.',
    totalAllocation: 85000000,
    availableAllocation: 31000000,
    allocationYear: 2024,
    serviceArea: ['TX'],
    serviceAreaType: 'state',
    headquartersCity: 'Austin',
    headquartersState: 'TX',
    missionFocus: ['healthcare', 'childcare', 'manufacturing', 'education'],
    projectTypes: ['new_construction', 'expansion', 'equipment'],
    minDealSize: 3000000,
    maxDealSize: 20000000,
    projectsClosed: 34,
    totalDeployed: 198000000,
    avgDealSize: 5800000,
    primaryContact: 'Roberto Garcia',
    contactEmail: 'rgarcia@texascc.org',
    contactPhone: '512-555-0400',
    website: 'https://texascc.org',
    acceptingApplications: true,
    responseTime: 'standard',
  },
  {
    id: 'cde-005',
    name: 'Great Lakes Development Corporation',
    slug: 'great-lakes',
    description: 'Serving the Great Lakes region with focus on manufacturing retention, healthcare expansion, and community facilities.',
    totalAllocation: 65000000,
    availableAllocation: 18000000,
    allocationYear: 2023,
    serviceArea: ['MI', 'OH', 'IN', 'PA', 'NY'],
    serviceAreaType: 'regional',
    headquartersCity: 'Detroit',
    headquartersState: 'MI',
    missionFocus: ['manufacturing', 'healthcare', 'community_facilities'],
    projectTypes: ['rehabilitation', 'expansion', 'equipment'],
    minDealSize: 2500000,
    maxDealSize: 12000000,
    projectsClosed: 41,
    totalDeployed: 267000000,
    avgDealSize: 6500000,
    primaryContact: 'David Morrison',
    contactEmail: 'dmorrison@greatlakesdc.org',
    contactPhone: '313-555-0500',
    website: 'https://greatlakesdc.org',
    acceptingApplications: true,
    responseTime: 'fast',
  },
  {
    id: 'cde-006',
    name: 'Southeast Impact Fund',
    slug: 'southeast-impact',
    description: 'Regional CDE serving the Southeast with strong focus on food access, healthcare, and community revitalization in severely distressed areas.',
    totalAllocation: 70000000,
    availableAllocation: 25000000,
    allocationYear: 2024,
    serviceArea: ['GA', 'FL', 'SC', 'NC', 'AL', 'TN', 'MS', 'LA'],
    serviceAreaType: 'regional',
    headquartersCity: 'Atlanta',
    headquartersState: 'GA',
    missionFocus: ['food_access', 'healthcare', 'community_facilities', 'childcare'],
    projectTypes: ['new_construction', 'rehabilitation'],
    minDealSize: 2000000,
    maxDealSize: 15000000,
    projectsClosed: 38,
    totalDeployed: 215000000,
    avgDealSize: 5650000,
    primaryContact: 'Michelle Thompson',
    contactEmail: 'mthompson@southeastimpact.org',
    contactPhone: '404-555-0600',
    website: 'https://southeastimpact.org',
    acceptingApplications: true,
    responseTime: 'standard',
  },
  {
    id: 'cde-007',
    name: 'Pacific Northwest CDE',
    slug: 'pacific-northwest',
    description: 'Serving Oregon, Washington, and Idaho with focus on renewable energy, healthcare, and rural development.',
    totalAllocation: 45000000,
    availableAllocation: 12000000,
    allocationYear: 2023,
    serviceArea: ['OR', 'WA', 'ID'],
    serviceAreaType: 'regional',
    headquartersCity: 'Portland',
    headquartersState: 'OR',
    missionFocus: ['renewable_energy', 'healthcare', 'rural', 'education'],
    projectTypes: ['new_construction', 'equipment'],
    minDealSize: 1500000,
    maxDealSize: 10000000,
    projectsClosed: 29,
    totalDeployed: 142000000,
    avgDealSize: 4900000,
    primaryContact: 'Karen Liu',
    contactEmail: 'kliu@pnwcde.org',
    contactPhone: '503-555-0700',
    website: 'https://pnwcde.org',
    acceptingApplications: false,
    responseTime: 'slow',
  },
  {
    id: 'cde-008',
    name: 'Native American Development Corporation',
    slug: 'nadc',
    description: 'Focused exclusively on Native American communities, reservations, and tribal lands across the United States.',
    totalAllocation: 40000000,
    availableAllocation: 15000000,
    allocationYear: 2024,
    serviceArea: ['ALL'],
    serviceAreaType: 'national',
    headquartersCity: 'Albuquerque',
    headquartersState: 'NM',
    missionFocus: ['native_american', 'healthcare', 'education', 'community_facilities'],
    projectTypes: ['new_construction', 'rehabilitation', 'expansion'],
    minDealSize: 1000000,
    maxDealSize: 8000000,
    projectsClosed: 24,
    totalDeployed: 98000000,
    avgDealSize: 4100000,
    primaryContact: 'Thomas Yazzie',
    contactEmail: 'tyazzie@nadc.org',
    contactPhone: '505-555-0800',
    website: 'https://nadc.org',
    acceptingApplications: true,
    responseTime: 'standard',
  },
  {
    id: 'cde-009',
    name: 'California Community Reinvestment',
    slug: 'cal-community',
    description: 'California-focused CDE with expertise in mixed-use development, affordable housing adjacent projects, and healthcare facilities.',
    totalAllocation: 95000000,
    availableAllocation: 35000000,
    allocationYear: 2024,
    serviceArea: ['CA'],
    serviceAreaType: 'state',
    headquartersCity: 'Los Angeles',
    headquartersState: 'CA',
    missionFocus: ['mixed_use', 'healthcare', 'community_facilities', 'childcare'],
    projectTypes: ['new_construction', 'rehabilitation'],
    minDealSize: 4000000,
    maxDealSize: 25000000,
    projectsClosed: 52,
    totalDeployed: 425000000,
    avgDealSize: 8200000,
    primaryContact: 'Linda Park',
    contactEmail: 'lpark@calcommunity.org',
    contactPhone: '213-555-0900',
    website: 'https://calcommunity.org',
    acceptingApplications: true,
    responseTime: 'fast',
  },
  {
    id: 'cde-010',
    name: 'New England Community Fund',
    slug: 'new-england',
    description: 'Serving all six New England states with focus on healthcare, education, and historic rehabilitation in urban cores.',
    totalAllocation: 50000000,
    availableAllocation: 8000000,
    allocationYear: 2022,
    serviceArea: ['MA', 'CT', 'RI', 'NH', 'VT', 'ME'],
    serviceAreaType: 'regional',
    headquartersCity: 'Boston',
    headquartersState: 'MA',
    missionFocus: ['healthcare', 'education', 'community_facilities'],
    projectTypes: ['rehabilitation', 'expansion'],
    minDealSize: 2000000,
    maxDealSize: 12000000,
    projectsClosed: 33,
    totalDeployed: 178000000,
    avgDealSize: 5400000,
    primaryContact: 'James O\'Brien',
    contactEmail: 'jobrien@necf.org',
    contactPhone: '617-555-1000',
    website: 'https://necf.org',
    acceptingApplications: true,
    responseTime: 'slow',
  },
];

// Helper functions
export function getCDEBySlug(slug: string): CDE | undefined {
  return DEMO_CDES.find(cde => cde.slug === slug);
}

export function getCDEsByState(state: string): CDE[] {
  return DEMO_CDES.filter(cde => 
    cde.serviceArea.includes('ALL') || cde.serviceArea.includes(state)
  );
}

export function getCDEsByMission(mission: MissionFocus): CDE[] {
  return DEMO_CDES.filter(cde => cde.missionFocus.includes(mission));
}

export function getCDEsAcceptingApplications(): CDE[] {
  return DEMO_CDES.filter(cde => cde.acceptingApplications);
}

export function getCDEsByDealSize(dealSize: number): CDE[] {
  return DEMO_CDES.filter(cde => 
    dealSize >= cde.minDealSize && dealSize <= cde.maxDealSize
  );
}

export function getCDEStats() {
  const accepting = DEMO_CDES.filter(c => c.acceptingApplications).length;
  const totalAvailable = DEMO_CDES.reduce((sum, c) => sum + c.availableAllocation, 0);
  
  return {
    total: DEMO_CDES.length,
    accepting,
    totalAvailable,
    national: DEMO_CDES.filter(c => c.serviceAreaType === 'national').length,
    regional: DEMO_CDES.filter(c => c.serviceAreaType === 'regional').length,
    state: DEMO_CDES.filter(c => c.serviceAreaType === 'state').length,
  };
}
