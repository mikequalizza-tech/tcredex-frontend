// Investor Demo Data
// Investors provide capital for HTC, LIHTC, OZ, Brownfield (direct)
// And also invest through CDEs for NMTC

export interface Investor {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  
  // Type
  investorType: InvestorType;
  
  // Capital info
  totalCapital: number;           // Total capital under management
  availableCapital: number;       // Currently seeking deployment
  targetDeployment: number;       // Annual target
  
  // Investment criteria
  programs: ProgramInterest[];    // Which programs they invest in
  minInvestment: number;
  maxInvestment: number;
  targetReturn: string;           // e.g., "7-9%" or "Market rate"
  
  // Geography
  geographicFocus: string[];      // States or 'ALL'
  focusType: 'national' | 'regional' | 'state' | 'local';
  
  // Preferences
  projectPreferences: ProjectPreference[];
  requiresCDE: boolean;           // Some investors only work through CDEs
  directInvestment: boolean;      // Can invest directly in projects
  
  // Track record
  dealsCompleted: number;
  totalInvested: number;
  avgDealSize: number;
  
  // Contact
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  
  // Status
  activelyInvesting: boolean;
  responseTime: 'fast' | 'standard' | 'slow';
}

export type InvestorType = 
  | 'bank'
  | 'insurance'
  | 'corporate'
  | 'family_office'
  | 'fund'
  | 'foundation'
  | 'government';

export type ProgramInterest = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ' | 'Brownfield';

export type ProjectPreference = 
  | 'healthcare'
  | 'education'
  | 'manufacturing'
  | 'retail'
  | 'mixed_use'
  | 'multifamily'
  | 'historic'
  | 'renewable_energy'
  | 'community_facilities';

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  bank: 'Bank / Financial Institution',
  insurance: 'Insurance Company',
  corporate: 'Corporate Investor',
  family_office: 'Family Office',
  fund: 'Investment Fund',
  foundation: 'Foundation',
  government: 'Government Entity',
};

export const PROGRAM_LABELS: Record<ProgramInterest, string> = {
  NMTC: 'New Markets Tax Credit',
  HTC: 'Historic Tax Credit',
  LIHTC: 'Low-Income Housing Tax Credit',
  OZ: 'Opportunity Zone',
  Brownfield: 'Brownfield Tax Credit',
};

export const DEMO_INVESTORS: Investor[] = [
  {
    id: 'inv-001',
    name: 'Great Lakes Bank',
    slug: 'great-lakes-bank',
    description: 'Regional bank with strong CRA commitment and active tax credit investment program across all major programs.',
    investorType: 'bank',
    totalCapital: 500000000,
    availableCapital: 85000000,
    targetDeployment: 100000000,
    programs: ['NMTC', 'HTC', 'LIHTC', 'OZ'],
    minInvestment: 2000000,
    maxInvestment: 25000000,
    targetReturn: '7-9%',
    geographicFocus: ['IL', 'IN', 'OH', 'MI', 'WI'],
    focusType: 'regional',
    projectPreferences: ['healthcare', 'multifamily', 'community_facilities'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 156,
    totalInvested: 890000000,
    avgDealSize: 5700000,
    primaryContact: 'Michael Thompson',
    contactEmail: 'mthompson@greatlakesbank.com',
    contactPhone: '312-555-2001',
    website: 'https://greatlakesbank.com',
    activelyInvesting: true,
    responseTime: 'fast',
  },
  {
    id: 'inv-002',
    name: 'National Tax Credit Partners',
    slug: 'ntcp',
    description: 'Dedicated tax credit syndicator and investor specializing in LIHTC and HTC transactions nationwide.',
    investorType: 'fund',
    totalCapital: 2000000000,
    availableCapital: 350000000,
    targetDeployment: 400000000,
    programs: ['HTC', 'LIHTC'],
    minInvestment: 5000000,
    maxInvestment: 50000000,
    targetReturn: '6-8%',
    geographicFocus: ['ALL'],
    focusType: 'national',
    projectPreferences: ['multifamily', 'historic', 'mixed_use'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 412,
    totalInvested: 3200000000,
    avgDealSize: 7800000,
    primaryContact: 'Elizabeth Warren',
    contactEmail: 'ewarren@ntcp.com',
    contactPhone: '617-555-2002',
    website: 'https://ntcp.com',
    activelyInvesting: true,
    responseTime: 'standard',
  },
  {
    id: 'inv-003',
    name: 'Heritage Insurance Group',
    slug: 'heritage-insurance',
    description: 'Insurance company seeking stable, long-term tax credit investments with focus on historic and community projects.',
    investorType: 'insurance',
    totalCapital: 800000000,
    availableCapital: 120000000,
    targetDeployment: 150000000,
    programs: ['NMTC', 'HTC', 'LIHTC'],
    minInvestment: 10000000,
    maxInvestment: 40000000,
    targetReturn: '5-7%',
    geographicFocus: ['ALL'],
    focusType: 'national',
    projectPreferences: ['historic', 'healthcare', 'education'],
    requiresCDE: true,
    directInvestment: false,
    dealsCompleted: 89,
    totalInvested: 1100000000,
    avgDealSize: 12400000,
    primaryContact: 'Robert Chen',
    contactEmail: 'rchen@heritageins.com',
    contactPhone: '860-555-2003',
    website: 'https://heritageins.com',
    activelyInvesting: true,
    responseTime: 'slow',
  },
  {
    id: 'inv-004',
    name: 'Sunbelt Capital Partners',
    slug: 'sunbelt-capital',
    description: 'Regional fund focused on Opportunity Zone and LIHTC investments in high-growth Sun Belt markets.',
    investorType: 'fund',
    totalCapital: 300000000,
    availableCapital: 75000000,
    targetDeployment: 80000000,
    programs: ['OZ', 'LIHTC'],
    minInvestment: 3000000,
    maxInvestment: 20000000,
    targetReturn: '10-14%',
    geographicFocus: ['TX', 'FL', 'AZ', 'NC', 'GA', 'TN'],
    focusType: 'regional',
    projectPreferences: ['multifamily', 'mixed_use', 'retail'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 67,
    totalInvested: 445000000,
    avgDealSize: 6600000,
    primaryContact: 'Amanda Rodriguez',
    contactEmail: 'arodriguez@sunbeltcap.com',
    contactPhone: '512-555-2004',
    website: 'https://sunbeltcap.com',
    activelyInvesting: true,
    responseTime: 'fast',
  },
  {
    id: 'inv-005',
    name: 'Community First Foundation',
    slug: 'community-first',
    description: 'Mission-driven foundation investing in community development projects with measurable social impact.',
    investorType: 'foundation',
    totalCapital: 150000000,
    availableCapital: 25000000,
    targetDeployment: 30000000,
    programs: ['NMTC', 'LIHTC'],
    minInvestment: 1000000,
    maxInvestment: 8000000,
    targetReturn: '4-6%',
    geographicFocus: ['ALL'],
    focusType: 'national',
    projectPreferences: ['healthcare', 'education', 'community_facilities'],
    requiresCDE: true,
    directInvestment: false,
    dealsCompleted: 45,
    totalInvested: 189000000,
    avgDealSize: 4200000,
    primaryContact: 'Patricia Williams',
    contactEmail: 'pwilliams@communityfirst.org',
    contactPhone: '415-555-2005',
    website: 'https://communityfirst.org',
    activelyInvesting: true,
    responseTime: 'standard',
  },
  {
    id: 'inv-006',
    name: 'Midwest Manufacturing Corp',
    slug: 'midwest-mfg',
    description: 'Corporate investor using tax credits to offset liability while supporting manufacturing and job creation.',
    investorType: 'corporate',
    totalCapital: 200000000,
    availableCapital: 40000000,
    targetDeployment: 50000000,
    programs: ['NMTC', 'HTC'],
    minInvestment: 5000000,
    maxInvestment: 15000000,
    targetReturn: 'Tax benefit focused',
    geographicFocus: ['IL', 'IN', 'OH', 'MI', 'WI', 'MN'],
    focusType: 'regional',
    projectPreferences: ['manufacturing', 'community_facilities'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 28,
    totalInvested: 167000000,
    avgDealSize: 6000000,
    primaryContact: 'James Miller',
    contactEmail: 'jmiller@midwestmfg.com',
    contactPhone: '414-555-2006',
    website: 'https://midwestmfg.com',
    activelyInvesting: true,
    responseTime: 'standard',
  },
  {
    id: 'inv-007',
    name: 'Pacific Coast Bank',
    slug: 'pacific-coast',
    description: 'West Coast bank with active CRA investment program focused on California and Pacific Northwest.',
    investorType: 'bank',
    totalCapital: 400000000,
    availableCapital: 65000000,
    targetDeployment: 80000000,
    programs: ['NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield'],
    minInvestment: 2500000,
    maxInvestment: 20000000,
    targetReturn: '6-8%',
    geographicFocus: ['CA', 'OR', 'WA'],
    focusType: 'regional',
    projectPreferences: ['multifamily', 'mixed_use', 'renewable_energy'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 134,
    totalInvested: 780000000,
    avgDealSize: 5800000,
    primaryContact: 'Kevin Park',
    contactEmail: 'kpark@pacificcoastbank.com',
    contactPhone: '213-555-2007',
    website: 'https://pacificcoastbank.com',
    activelyInvesting: true,
    responseTime: 'fast',
  },
  {
    id: 'inv-008',
    name: 'Northeast Family Office',
    slug: 'northeast-fo',
    description: 'Multi-family office seeking tax-advantaged investments in historic and community development projects.',
    investorType: 'family_office',
    totalCapital: 100000000,
    availableCapital: 20000000,
    targetDeployment: 25000000,
    programs: ['HTC', 'OZ'],
    minInvestment: 1000000,
    maxInvestment: 10000000,
    targetReturn: '8-12%',
    geographicFocus: ['MA', 'NY', 'CT', 'NJ', 'PA'],
    focusType: 'regional',
    projectPreferences: ['historic', 'mixed_use', 'multifamily'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 23,
    totalInvested: 89000000,
    avgDealSize: 3900000,
    primaryContact: 'William Fitzgerald',
    contactEmail: 'wfitzgerald@nefo.com',
    contactPhone: '617-555-2008',
    website: 'https://nefo.com',
    activelyInvesting: true,
    responseTime: 'fast',
  },
  {
    id: 'inv-009',
    name: 'Green Energy Investors',
    slug: 'green-energy',
    description: 'Specialized fund focused on renewable energy and brownfield remediation projects with environmental impact.',
    investorType: 'fund',
    totalCapital: 250000000,
    availableCapital: 55000000,
    targetDeployment: 60000000,
    programs: ['Brownfield', 'OZ'],
    minInvestment: 2000000,
    maxInvestment: 15000000,
    targetReturn: '9-11%',
    geographicFocus: ['ALL'],
    focusType: 'national',
    projectPreferences: ['renewable_energy'],
    requiresCDE: false,
    directInvestment: true,
    dealsCompleted: 42,
    totalInvested: 310000000,
    avgDealSize: 7400000,
    primaryContact: 'Sarah Green',
    contactEmail: 'sgreen@greenenergyinv.com',
    contactPhone: '303-555-2009',
    website: 'https://greenenergyinv.com',
    activelyInvesting: true,
    responseTime: 'standard',
  },
  {
    id: 'inv-010',
    name: 'State Pension Fund',
    slug: 'state-pension',
    description: 'Government pension fund with mandate for stable, tax-advantaged community investments.',
    investorType: 'government',
    totalCapital: 1000000000,
    availableCapital: 150000000,
    targetDeployment: 200000000,
    programs: ['NMTC', 'LIHTC'],
    minInvestment: 15000000,
    maxInvestment: 50000000,
    targetReturn: '5-7%',
    geographicFocus: ['ALL'],
    focusType: 'national',
    projectPreferences: ['multifamily', 'healthcare', 'education'],
    requiresCDE: true,
    directInvestment: false,
    dealsCompleted: 78,
    totalInvested: 1450000000,
    avgDealSize: 18600000,
    primaryContact: 'Margaret Sullivan',
    contactEmail: 'msullivan@statepension.gov',
    contactPhone: '916-555-2010',
    website: 'https://statepension.gov',
    activelyInvesting: true,
    responseTime: 'slow',
  },
];

// Helper functions
export function getInvestorsByProgram(program: ProgramInterest): Investor[] {
  return DEMO_INVESTORS.filter(inv => inv.programs.includes(program));
}

export function getInvestorBySlug(slug: string): Investor | undefined {
  return DEMO_INVESTORS.find(inv => inv.slug === slug);
}

export function getInvestorsByState(state: string): Investor[] {
  return DEMO_INVESTORS.filter(inv => 
    inv.geographicFocus.includes('ALL') || inv.geographicFocus.includes(state)
  );
}

export function getInvestorsAcceptingDeals(): Investor[] {
  return DEMO_INVESTORS.filter(inv => inv.activelyInvesting);
}

export function getInvestorsByDealSize(dealSize: number): Investor[] {
  return DEMO_INVESTORS.filter(inv => 
    dealSize >= inv.minInvestment && dealSize <= inv.maxInvestment
  );
}

export function getDirectInvestors(): Investor[] {
  return DEMO_INVESTORS.filter(inv => inv.directInvestment);
}

export function getCDEInvestors(): Investor[] {
  return DEMO_INVESTORS.filter(inv => inv.requiresCDE || inv.programs.includes('NMTC'));
}

export function getInvestorStats() {
  const active = DEMO_INVESTORS.filter(i => i.activelyInvesting).length;
  const totalAvailable = DEMO_INVESTORS.reduce((sum, i) => sum + i.availableCapital, 0);
  
  return {
    total: DEMO_INVESTORS.length,
    active,
    totalAvailable,
    byProgram: {
      NMTC: DEMO_INVESTORS.filter(i => i.programs.includes('NMTC')).length,
      HTC: DEMO_INVESTORS.filter(i => i.programs.includes('HTC')).length,
      LIHTC: DEMO_INVESTORS.filter(i => i.programs.includes('LIHTC')).length,
      OZ: DEMO_INVESTORS.filter(i => i.programs.includes('OZ')).length,
      Brownfield: DEMO_INVESTORS.filter(i => i.programs.includes('Brownfield')).length,
    },
    byType: {
      bank: DEMO_INVESTORS.filter(i => i.investorType === 'bank').length,
      fund: DEMO_INVESTORS.filter(i => i.investorType === 'fund').length,
      insurance: DEMO_INVESTORS.filter(i => i.investorType === 'insurance').length,
      corporate: DEMO_INVESTORS.filter(i => i.investorType === 'corporate').length,
      other: DEMO_INVESTORS.filter(i => ['family_office', 'foundation', 'government'].includes(i.investorType)).length,
    },
  };
}
