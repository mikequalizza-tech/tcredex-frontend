import { CDEDealCard } from '@/lib/types/cde';

// Mock CDE data for testing the Sponsor view
export const mockCDEs: CDEDealCard[] = [
  {
    id: 'CDE001',
    organizationName: 'Midwest Community Capital',
    missionSnippet: 'Dedicated to revitalizing distressed communities across the Midwest through job creation and community facility development.',
    remainingAllocation: 35000000,
    allocationDeadline: '2025-12-31',
    primaryStates: ['IL', 'IN', 'OH', 'MI', 'WI'],
    targetSectors: ['Manufacturing', 'Healthcare / Medical', 'Community Facility'],
    impactPriorities: ['job-creation', 'manufacturing-revival', 'healthcare-access'],
    dealSizeRange: { min: 2000000, max: 15000000 },
    ruralFocus: true,
    urbanFocus: true,
    requireSeverelyDistressed: false,
    htcExperience: true,
    smallDealFund: false,
    status: 'active',
    lastUpdated: '2024-12-01',
  },
  {
    id: 'CDE002',
    organizationName: 'Urban Development Partners',
    missionSnippet: 'Focused on creating sustainable economic opportunities in severely distressed urban census tracts through small business and mixed-use development.',
    remainingAllocation: 22000000,
    allocationDeadline: '2025-06-30',
    primaryStates: ['NY', 'NJ', 'PA', 'CT', 'MA'],
    targetSectors: ['Real Estate - Mixed Use', 'Food Access / Grocery', 'Childcare / Early Learning'],
    impactPriorities: ['job-creation', 'food-access', 'education-childcare', 'minority-owned-business'],
    dealSizeRange: { min: 3000000, max: 12000000 },
    ruralFocus: false,
    urbanFocus: true,
    requireSeverelyDistressed: true,
    htcExperience: true,
    smallDealFund: false,
    status: 'active',
    lastUpdated: '2024-11-15',
  },
  {
    id: 'CDE003',
    organizationName: 'Rural America Fund',
    missionSnippet: 'Bringing patient capital to underserved rural communities, with emphasis on agricultural processing, healthcare, and essential services.',
    remainingAllocation: 18000000,
    primaryStates: ['IA', 'NE', 'KS', 'MO', 'AR', 'OK'],
    targetSectors: ['Agriculture / Farming', 'Healthcare / Medical', 'Manufacturing'],
    impactPriorities: ['rural-development', 'healthcare-access', 'job-creation', 'small-business-support'],
    dealSizeRange: { min: 1000000, max: 8000000 },
    ruralFocus: true,
    urbanFocus: false,
    requireSeverelyDistressed: false,
    htcExperience: false,
    smallDealFund: true,
    status: 'active',
    lastUpdated: '2024-12-10',
  },
  {
    id: 'CDE004',
    organizationName: 'Historic Preservation CDE',
    missionSnippet: 'Specializing in historic tax credit and NMTC combined transactions. Expert in adaptive reuse of historic structures in low-income communities.',
    remainingAllocation: 28000000,
    primaryStates: ['VA', 'NC', 'SC', 'GA', 'FL', 'TN'],
    targetSectors: ['Real Estate - Commercial', 'Real Estate - Mixed Use', 'Hospitality / Hotel', 'Arts / Cultural'],
    impactPriorities: ['job-creation', 'community-services', 'wealth-creation'],
    dealSizeRange: { min: 5000000, max: 20000000 },
    ruralFocus: true,
    urbanFocus: true,
    requireSeverelyDistressed: false,
    htcExperience: true,
    smallDealFund: false,
    status: 'active',
    lastUpdated: '2024-11-28',
  },
  {
    id: 'CDE005',
    organizationName: 'Native American Capital Corp',
    missionSnippet: 'Dedicated exclusively to economic development in Native American communities across the nation. Tribal enterprise and community facility focus.',
    remainingAllocation: 15000000,
    primaryStates: ['AZ', 'NM', 'OK', 'SD', 'MT', 'WA', 'AK'],
    targetSectors: ['Community Facility', 'Healthcare / Medical', 'Educational', 'Energy / Clean Tech'],
    impactPriorities: ['native-american-communities', 'healthcare-access', 'education-childcare', 'job-creation'],
    dealSizeRange: { min: 1500000, max: 10000000 },
    ruralFocus: true,
    urbanFocus: false,
    requireSeverelyDistressed: false,
    htcExperience: false,
    smallDealFund: true,
    status: 'active',
    lastUpdated: '2024-12-05',
  },
  {
    id: 'CDE006',
    organizationName: 'Gulf Coast Development Fund',
    missionSnippet: 'Supporting economic recovery and growth along the Gulf Coast with focus on manufacturing, port facilities, and disaster-resilient infrastructure.',
    remainingAllocation: 42000000,
    allocationDeadline: '2026-06-30',
    primaryStates: ['TX', 'LA', 'MS', 'AL', 'FL'],
    targetSectors: ['Manufacturing', 'Infrastructure', 'Energy / Clean Tech', 'Real Estate - Industrial'],
    impactPriorities: ['job-creation', 'manufacturing-revival', 'environmental-sustainability'],
    dealSizeRange: { min: 5000000, max: 25000000 },
    ruralFocus: true,
    urbanFocus: true,
    requireSeverelyDistressed: false,
    htcExperience: false,
    smallDealFund: false,
    status: 'active',
    lastUpdated: '2024-12-08',
  },
  {
    id: 'CDE007',
    organizationName: 'Small Deal Accelerator',
    missionSnippet: 'Exclusively focused on deals under $5M to serve small businesses and community facilities that larger CDEs overlook.',
    remainingAllocation: 8000000,
    primaryStates: [], // National
    targetSectors: ['Community Facility', 'Healthcare / Medical', 'Childcare / Early Learning', 'Food Access / Grocery'],
    impactPriorities: ['small-business-support', 'community-services', 'job-creation'],
    dealSizeRange: { min: 500000, max: 5000000 },
    ruralFocus: true,
    urbanFocus: true,
    requireSeverelyDistressed: false,
    htcExperience: false,
    smallDealFund: true,
    status: 'active',
    lastUpdated: '2024-12-12',
  },
  {
    id: 'CDE008',
    organizationName: 'California Community Fund',
    missionSnippet: 'Serving California\'s diverse communities with emphasis on affordable childcare, community health centers, and minority-owned businesses.',
    remainingAllocation: 31000000,
    primaryStates: ['CA'],
    targetSectors: ['Childcare / Early Learning', 'Healthcare / Medical', 'Food Access / Grocery', 'Real Estate - Mixed Use'],
    impactPriorities: ['education-childcare', 'healthcare-access', 'minority-owned-business', 'food-access'],
    dealSizeRange: { min: 3000000, max: 15000000 },
    ruralFocus: false,
    urbanFocus: true,
    requireSeverelyDistressed: true,
    htcExperience: true,
    smallDealFund: false,
    status: 'active',
    lastUpdated: '2024-11-20',
  },
];

// Calculate match score between a project and CDE
export function calculateCDEMatchScore(
  cde: CDEDealCard,
  project: {
    state?: string;
    projectType?: string;
    allocationRequest?: number;
    isRural?: boolean;
    isSeverelyDistressed?: boolean;
    impactAreas?: string[];
  }
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Geographic match (30 points)
  if (project.state) {
    if (cde.primaryStates.length === 0) {
      // National CDE
      score += 25;
      reasons.push('CDE serves nationwide');
    } else if (cde.primaryStates.includes(project.state)) {
      score += 30;
      reasons.push(`CDE actively serves ${project.state}`);
    }
  }
  
  // Sector match (25 points)
  if (project.projectType && cde.targetSectors.some(s => s.toLowerCase().includes(project.projectType!.toLowerCase()))) {
    score += 25;
    reasons.push('Project type aligns with CDE focus');
  }
  
  // Deal size match (20 points)
  if (project.allocationRequest) {
    if (project.allocationRequest >= cde.dealSizeRange.min && project.allocationRequest <= cde.dealSizeRange.max) {
      score += 20;
      reasons.push('Deal size within CDE range');
    } else if (project.allocationRequest < cde.dealSizeRange.min && cde.smallDealFund) {
      score += 15;
      reasons.push('Small deal fund accepts smaller transactions');
    }
  }
  
  // Rural/Urban match (10 points)
  if (project.isRural !== undefined) {
    if (project.isRural && cde.ruralFocus) {
      score += 10;
      reasons.push('CDE has rural focus');
    } else if (!project.isRural && cde.urbanFocus) {
      score += 10;
      reasons.push('CDE serves urban areas');
    }
  }
  
  // Distress match (15 points)
  if (project.isSeverelyDistressed && cde.requireSeverelyDistressed) {
    score += 15;
    reasons.push('Project meets severely distressed requirement');
  } else if (!cde.requireSeverelyDistressed) {
    score += 10; // No restriction is good
  }
  
  return { score: Math.min(score, 100), reasons };
}
