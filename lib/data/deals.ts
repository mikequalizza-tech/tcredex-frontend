import { fetchDeals, fetchDealById as fetchSupabaseDealById } from '../supabase/queries';

/**
 * tCredex Demo Data — Single Source of Truth
 * 
 * All demo/sample data for the platform lives here.
 * When we connect to a real database, we replace these with API calls.
 */

// ============================================================
// TYPES
// ============================================================

export type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
export type ProgramLevel = 'federal' | 'state';
export type DealStatus = 'available' | 'under_review' | 'matched' | 'closing' | 'closed';
export type TractType = 'QCT' | 'SD' | 'LIC' | 'DDA';

export interface Deal {
  id: string;
  projectName: string;
  sponsorName: string;
  sponsorDescription?: string;
  website?: string;
  programType: ProgramType;
  programLevel: ProgramLevel;
  stateProgram?: string;
  allocation: number;
  creditPrice: number;
  state: string;
  city: string;
  tractType: TractType[];
  status: DealStatus;
  description?: string;
  communityImpact?: string;  // Community impact statement for Project Profile
  projectHighlights?: string[];
  useOfFunds?: { category: string; amount: number }[];
  timeline?: { milestone: string; date: string; completed: boolean }[];
  foundedYear?: number;
  submittedDate: string;
  povertyRate?: number;
  medianIncome?: number;
  jobsCreated?: number;
  visible: boolean;
  // Added fields for compatibility with DealCard and Intake
  location?: string;
  projectCost?: number;
  financingGap?: number;
  address?: string;
  censusTract?: string;
  parent?: string;
  unemployment?: number;
  fedNmtcReq?: number;
  stateNmtcReq?: number;
  htc?: number;
  lihtc?: number;
  shovelReady?: boolean;
  completionDate?: string;
  coordinates?: [number, number];
  hasProfile?: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

export const PROGRAM_COLORS: Record<ProgramType, { bg: string; text: string; border: string; gradient: string }> = {
  NMTC: { bg: 'bg-emerald-900/50', text: 'text-emerald-400', border: 'border-emerald-700', gradient: 'from-emerald-600 to-emerald-800' },
  HTC: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-700', gradient: 'from-blue-600 to-blue-800' },
  LIHTC: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-700', gradient: 'from-purple-600 to-purple-800' },
  OZ: { bg: 'bg-amber-900/50', text: 'text-amber-400', border: 'border-amber-700', gradient: 'from-amber-600 to-amber-800' },
};

export const LEVEL_COLORS: Record<ProgramLevel, string> = {
  federal: 'bg-gray-800 text-gray-300',
  state: 'bg-sky-900/50 text-sky-400',
};

export const STATUS_CONFIG: Record<DealStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-900/50 text-green-400' },
  under_review: { label: 'Under Review', color: 'bg-amber-900/50 text-amber-400' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-400' },
  closing: { label: 'Closing', color: 'bg-blue-900/50 text-blue-400' },
  closed: { label: 'Closed', color: 'bg-gray-700 text-gray-400' },
};

export const TRACT_LABELS: Record<TractType, string> = {
  QCT: 'Qualified Census Tract',
  SD: 'Severely Distressed',
  LIC: 'Low-Income Community',
  DDA: 'Difficult Development Area',
};

export const US_STATES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

// ============================================================
// DEMO DEALS — 25 Sample Projects
// ============================================================

export const DEMO_DEALS: Deal[] = [
  { 
    id: 'deal-001', 
    projectName: 'Downtown Community Center', 
    sponsorName: 'Metro Development Corp', 
    sponsorDescription: 'Metro Development Corp has been developing community-focused real estate projects since 2018, with a focus on underserved urban areas.',
    website: 'www.metrodev.com', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 15000000, 
    creditPrice: 0.76, 
    state: 'Illinois', 
    city: 'Chicago', 
    tractType: ['QCT', 'SD'], 
    status: 'available', 
    description: 'A transformative mixed-use community facility in Chicago\'s South Side, featuring a workforce training center, community health clinic, early childhood education center, and flexible event space. The project will serve as an anchor for neighborhood revitalization in a Severely Distressed census tract.',
    communityImpact: `This project will create transformative change for Chicago's South Side community:

• 85 permanent jobs with living wages and benefits, prioritizing local hiring
• 150 construction jobs during the 18-month build phase
• Free workforce training programs serving 500+ residents annually
• Community health clinic providing 10,000+ patient visits per year
• Early childhood education center with 75 slots for low-income families
• 28.4% poverty rate census tract - desperately underserved

The project addresses critical gaps in healthcare access, job training, and childcare that have held this community back for decades. By co-locating these services, we create a one-stop resource center that removes barriers to economic mobility.`,
    projectHighlights: [
      '45,000 SF mixed-use facility',
      'Located in Qualified Census Tract with 28.4% poverty rate',
      'Partnership with local community college for workforce training',
      'Will create 85 permanent jobs, 150 construction jobs',
      'LEED Silver certification targeted',
    ],
    useOfFunds: [
      { category: 'Construction', amount: 11500000 },
      { category: 'Equipment & FF&E', amount: 1800000 },
      { category: 'Soft Costs', amount: 1200000 },
      { category: 'Working Capital', amount: 500000 },
    ],
    timeline: [
      { milestone: 'NMTC Allocation Secured', date: 'Q4 2024', completed: true },
      { milestone: 'Site Control Finalized', date: 'Q4 2024', completed: true },
      { milestone: 'Construction Start', date: 'Q1 2025', completed: false },
      { milestone: 'Construction Complete', date: 'Q4 2025', completed: false },
      { milestone: 'Grand Opening', date: 'Q1 2026', completed: false },
    ],
    foundedYear: 2018, 
    submittedDate: '2024-12-01', 
    povertyRate: 28.4, 
    medianIncome: 32500,
    jobsCreated: 85,
    visible: true 
  },
  { 
    id: 'deal-002', 
    projectName: 'Heritage Theater Restoration', 
    sponsorName: 'Historic Holdings LLC', 
    sponsorDescription: 'Historic Holdings specializes in the sensitive rehabilitation of historic properties, preserving architectural heritage while creating sustainable community assets.',
    website: 'www.historicholdings.com', 
    programType: 'HTC', 
    programLevel: 'federal', 
    allocation: 8500000, 
    creditPrice: 0.92, 
    state: 'Ohio', 
    city: 'Cleveland', 
    tractType: ['QCT'], 
    status: 'under_review', 
    description: 'Complete rehabilitation of the 1927 Majestic Theater, a stunning Art Deco landmark on the National Register of Historic Places. The restored theater will serve as a premier performing arts venue and community gathering space, anchoring downtown Cleveland\'s entertainment district revival.',
    projectHighlights: [
      'Listed on National Register of Historic Places',
      '1,200-seat main theater + 200-seat black box',
      'Original Art Deco details being meticulously restored',
      'State HTC stacking opportunity available',
      'Anchor tenant LOI signed with regional symphony',
    ],
    useOfFunds: [
      { category: 'Qualified Rehabilitation', amount: 7200000 },
      { category: 'Non-QRE Work', amount: 800000 },
      { category: 'Soft Costs', amount: 500000 },
    ],
    timeline: [
      { milestone: 'NPS Part 1 Approved', date: 'Q2 2024', completed: true },
      { milestone: 'NPS Part 2 Approved', date: 'Q3 2024', completed: true },
      { milestone: 'Construction Start', date: 'Q4 2024', completed: false },
      { milestone: 'NPS Part 3 Submission', date: 'Q4 2025', completed: false },
      { milestone: 'Grand Reopening', date: 'Q1 2026', completed: false },
    ],
    foundedYear: 2015, 
    submittedDate: '2024-11-15', 
    jobsCreated: 45,
    visible: true 
  },
  { 
    id: 'deal-003', 
    projectName: 'Riverside Affordable Housing', 
    sponsorName: 'Community Builders Inc', 
    sponsorDescription: 'Community Builders Inc is a nonprofit housing developer with 15+ years of experience creating quality affordable housing throughout the Midwest.',
    website: 'www.communitybuilders.org', 
    programType: 'LIHTC', 
    programLevel: 'federal', 
    allocation: 22000000, 
    creditPrice: 0.88, 
    state: 'Michigan', 
    city: 'Detroit', 
    tractType: ['QCT', 'DDA'], 
    status: 'available', 
    description: 'New construction of 120 affordable rental units serving households at 30-60% AMI. The development includes family-sized units, community amenities, and supportive services. Located in a Difficult Development Area, making it eligible for the 130% basis boost.',
    projectHighlights: [
      '120 units: 30 @ 30% AMI, 60 @ 50% AMI, 30 @ 60% AMI',
      'DDA location qualifies for 130% basis boost',
      'On-site property management and resident services',
      'Energy-efficient design exceeds code by 20%',
      'Partnership with Detroit Housing Authority',
    ],
    useOfFunds: [
      { category: 'Land & Site Work', amount: 3500000 },
      { category: 'Construction', amount: 16000000 },
      { category: 'Soft Costs', amount: 2000000 },
      { category: 'Reserves', amount: 500000 },
    ],
    timeline: [
      { milestone: 'LIHTC Allocation Awarded', date: 'Q3 2024', completed: true },
      { milestone: 'Construction Financing Closed', date: 'Q4 2024', completed: true },
      { milestone: 'Construction Start', date: 'Q1 2025', completed: false },
      { milestone: 'First Units Delivered', date: 'Q1 2026', completed: false },
      { milestone: 'Full Lease-Up', date: 'Q3 2026', completed: false },
    ],
    foundedYear: 2010, 
    submittedDate: '2024-12-05', 
    povertyRate: 32.1, 
    jobsCreated: 120,
    visible: true 
  },
  { 
    id: 'deal-004', 
    projectName: 'Bay Area Workforce Housing', 
    sponsorName: 'Golden State Developers', 
    website: 'www.goldenstatedev.com', 
    programType: 'LIHTC', 
    programLevel: 'state', 
    stateProgram: 'CA State LIHTC', 
    allocation: 18000000, 
    creditPrice: 0.91, 
    state: 'California', 
    city: 'Oakland', 
    tractType: ['QCT'], 
    status: 'available', 
    foundedYear: 2019, 
    submittedDate: '2024-12-08', 
    povertyRate: 26.5, 
    visible: true 
  },
  { 
    id: 'deal-005', 
    projectName: 'Tech Manufacturing Hub', 
    sponsorName: 'Industrial Partners', 
    website: 'www.industrialpartners.com', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 18000000, 
    creditPrice: 0.75, 
    state: 'Indiana', 
    city: 'Indianapolis', 
    tractType: ['LIC', 'SD'], 
    status: 'matched', 
    foundedYear: 2020, 
    submittedDate: '2024-10-20', 
    povertyRate: 24.5, 
    visible: true 
  },
  { 
    id: 'deal-006', 
    projectName: 'Empire State Historic Lofts', 
    sponsorName: 'NY Heritage Partners', 
    website: 'www.nyheritage.com', 
    programType: 'HTC', 
    programLevel: 'state', 
    stateProgram: 'NY State HTC', 
    allocation: 12000000, 
    creditPrice: 0.88, 
    state: 'New York', 
    city: 'Buffalo', 
    tractType: ['QCT'], 
    status: 'available', 
    foundedYear: 2017, 
    submittedDate: '2024-12-03', 
    visible: true 
  },
  { 
    id: 'deal-007', 
    projectName: 'Main Street Revitalization', 
    sponsorName: 'Downtown Partners LLC', 
    sponsorDescription: 'Downtown Partners focuses on urban infill development that catalyzes neighborhood transformation while generating competitive risk-adjusted returns.',
    website: 'www.downtownpartners.com', 
    programType: 'OZ', 
    programLevel: 'federal', 
    allocation: 10000000, 
    creditPrice: 0.85, 
    state: 'Wisconsin', 
    city: 'Milwaukee', 
    tractType: ['QCT'], 
    status: 'closing', 
    description: 'Ground-up mixed-use development in a designated Opportunity Zone, featuring 40 market-rate apartments, 8,000 SF of ground-floor retail, and structured parking. The project will bring new residents and commercial activity to Milwaukee\'s emerging Near West Side neighborhood.',
    projectHighlights: [
      'Qualified Opportunity Zone investment',
      '40 market-rate apartments + 8,000 SF retail',
      '10-year hold strategy for maximum OZ benefit',
      'Adjacent to new streetcar line',
      'Retail pre-leased to local restaurant group',
    ],
    useOfFunds: [
      { category: 'Land Acquisition', amount: 1500000 },
      { category: 'Construction', amount: 7500000 },
      { category: 'Soft Costs', amount: 700000 },
      { category: 'Reserves', amount: 300000 },
    ],
    timeline: [
      { milestone: 'QOF Established', date: 'Q2 2024', completed: true },
      { milestone: 'Land Acquisition', date: 'Q3 2024', completed: true },
      { milestone: 'Construction Start', date: 'Q4 2024', completed: true },
      { milestone: 'Certificate of Occupancy', date: 'Q4 2025', completed: false },
      { milestone: 'Stabilization', date: 'Q2 2026', completed: false },
    ],
    foundedYear: 2019, 
    submittedDate: '2024-09-15', 
    jobsCreated: 65,
    visible: true 
  },
  { 
    id: 'deal-008', 
    projectName: 'Rural Health Clinic Network', 
    sponsorName: 'HealthFirst Foundation', 
    website: 'www.healthfirst.org', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 12000000, 
    creditPrice: 0.74, 
    state: 'Iowa', 
    city: 'Des Moines', 
    tractType: ['LIC'], 
    status: 'available', 
    foundedYear: 2012, 
    submittedDate: '2024-12-08', 
    povertyRate: 22.3, 
    visible: true 
  },
  { 
    id: 'deal-009', 
    projectName: 'Missouri Affordable Homes', 
    sponsorName: 'Gateway Housing', 
    website: 'www.gatewayhousing.org', 
    programType: 'LIHTC', 
    programLevel: 'state', 
    stateProgram: 'MO State LIHTC', 
    allocation: 9500000, 
    creditPrice: 0.84, 
    state: 'Missouri', 
    city: 'Kansas City', 
    tractType: ['QCT', 'DDA'], 
    status: 'available', 
    foundedYear: 2016, 
    submittedDate: '2024-12-06', 
    povertyRate: 29.8, 
    visible: true 
  },
  { 
    id: 'deal-010', 
    projectName: 'Eastside Grocery Co-Op', 
    sponsorName: 'Food Access Initiative', 
    website: 'www.foodaccess.org', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 4500000, 
    creditPrice: 0.77, 
    state: 'Minnesota', 
    city: 'Minneapolis', 
    tractType: ['QCT', 'SD'], 
    status: 'available', 
    foundedYear: 2021, 
    submittedDate: '2024-12-10', 
    povertyRate: 35.2, 
    visible: true 
  },
  { 
    id: 'deal-011', 
    projectName: 'Virginia Historic Mill', 
    sponsorName: 'Commonwealth Restoration', 
    website: 'www.commonwealthrest.com', 
    programType: 'HTC', 
    programLevel: 'state', 
    stateProgram: 'VA State HTC', 
    allocation: 7500000, 
    creditPrice: 0.90, 
    state: 'Virginia', 
    city: 'Richmond', 
    tractType: ['QCT'], 
    status: 'under_review', 
    foundedYear: 2014, 
    submittedDate: '2024-11-28', 
    visible: true 
  },
  { 
    id: 'deal-012', 
    projectName: 'Workforce Training Center', 
    sponsorName: 'Skills Development Corp', 
    website: 'www.skillsdev.com', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 9000000, 
    creditPrice: 0.76, 
    state: 'Missouri', 
    city: 'St. Louis', 
    tractType: ['QCT'], 
    status: 'under_review', 
    foundedYear: 2017, 
    submittedDate: '2024-11-25', 
    povertyRate: 26.8, 
    visible: true 
  },
  { 
    id: 'deal-013', 
    projectName: 'Arts District Lofts', 
    sponsorName: 'Creative Spaces LLC', 
    website: 'www.creativespaces.com', 
    programType: 'HTC', 
    programLevel: 'federal', 
    allocation: 14000000, 
    creditPrice: 0.91, 
    state: 'Pennsylvania', 
    city: 'Pittsburgh', 
    tractType: ['QCT'], 
    status: 'available', 
    foundedYear: 2016, 
    submittedDate: '2024-12-02', 
    visible: true 
  },
  { 
    id: 'deal-014', 
    projectName: 'Green Energy Campus', 
    sponsorName: 'Sustainable Ventures', 
    website: 'www.sustainableventures.com', 
    programType: 'OZ', 
    programLevel: 'federal', 
    allocation: 25000000, 
    creditPrice: 0.82, 
    state: 'Colorado', 
    city: 'Denver', 
    tractType: ['QCT', 'SD'], 
    status: 'matched', 
    foundedYear: 2022, 
    submittedDate: '2024-10-30', 
    visible: true 
  },
  { 
    id: 'deal-015', 
    projectName: 'Georgia Workforce Housing', 
    sponsorName: 'Peach State Housing', 
    website: 'www.peachstatehousing.com', 
    programType: 'LIHTC', 
    programLevel: 'state', 
    stateProgram: 'GA State LIHTC', 
    allocation: 14000000, 
    creditPrice: 0.86, 
    state: 'Georgia', 
    city: 'Atlanta', 
    tractType: ['QCT', 'DDA'], 
    status: 'available', 
    foundedYear: 2018, 
    submittedDate: '2024-12-04', 
    povertyRate: 31.2, 
    visible: true 
  },
  { 
    id: 'deal-016', 
    projectName: 'Senior Living Community', 
    sponsorName: 'Elder Care Partners', 
    website: 'www.eldercarepartners.com', 
    programType: 'LIHTC', 
    programLevel: 'federal', 
    allocation: 18500000, 
    creditPrice: 0.87, 
    state: 'Florida', 
    city: 'Tampa', 
    tractType: ['DDA'], 
    status: 'available', 
    foundedYear: 2014, 
    submittedDate: '2024-12-06', 
    visible: true 
  },
  { 
    id: 'deal-017', 
    projectName: 'Mixed-Use Transit Hub', 
    sponsorName: 'Urban Transit Development', 
    website: 'www.urbantransit.com', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 32000000, 
    creditPrice: 0.78, 
    state: 'California', 
    city: 'Los Angeles', 
    tractType: ['QCT', 'LIC'], 
    status: 'under_review', 
    foundedYear: 2019, 
    submittedDate: '2024-11-18', 
    povertyRate: 29.1, 
    visible: true 
  },
  { 
    id: 'deal-018', 
    projectName: 'Community Hospital Expansion', 
    sponsorName: 'Regional Health Systems', 
    website: 'www.regionalhealthsys.org', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 28000000, 
    creditPrice: 0.75, 
    state: 'Texas', 
    city: 'Houston', 
    tractType: ['QCT', 'SD'], 
    status: 'available', 
    foundedYear: 2008, 
    submittedDate: '2024-12-09', 
    povertyRate: 31.4, 
    visible: true 
  },
  { 
    id: 'deal-019', 
    projectName: 'Historic Hotel Renovation', 
    sponsorName: 'Landmark Properties', 
    website: 'www.landmarkprops.com', 
    programType: 'HTC', 
    programLevel: 'federal', 
    allocation: 11000000, 
    creditPrice: 0.93, 
    state: 'Louisiana', 
    city: 'New Orleans', 
    tractType: ['QCT'], 
    status: 'closing', 
    foundedYear: 2011, 
    submittedDate: '2024-09-28', 
    visible: true 
  },
  { 
    id: 'deal-020', 
    projectName: 'Maryland Historic Theater', 
    sponsorName: 'Chesapeake Restoration', 
    website: 'www.chesapeakerest.com', 
    programType: 'HTC', 
    programLevel: 'state', 
    stateProgram: 'MD State HTC', 
    allocation: 6500000, 
    creditPrice: 0.85, 
    state: 'Maryland', 
    city: 'Baltimore', 
    tractType: ['QCT'], 
    status: 'available', 
    foundedYear: 2019, 
    submittedDate: '2024-12-07', 
    visible: true 
  },
  { 
    id: 'deal-021', 
    projectName: 'Youth Education Center', 
    sponsorName: 'Future Leaders Foundation', 
    website: 'www.futureleaders.org', 
    programType: 'NMTC', 
    programLevel: 'federal', 
    allocation: 7500000, 
    creditPrice: 0.76, 
    state: 'Georgia', 
    city: 'Savannah', 
    tractType: ['QCT', 'SD'], 
    status: 'available', 
    foundedYear: 2020, 
    submittedDate: '2024-12-11', 
    povertyRate: 33.8, 
    visible: true 
  },
  { 
    id: 'deal-022', 
    projectName: 'Industrial Park Phase II', 
    sponsorName: 'Commerce Development Group', 
    website: 'www.commercedev.com', 
    programType: 'OZ', 
    programLevel: 'federal', 
    allocation: 45000000, 
    creditPrice: 0.80, 
    state: 'Arizona', 
    city: 'Phoenix', 
    tractType: ['QCT'], 
    status: 'matched', 
    foundedYear: 2018, 
    submittedDate: '2024-10-15', 
    visible: true 
  },
  { 
    id: 'deal-023', 
    projectName: 'Connecticut Affordable Housing', 
    sponsorName: 'Nutmeg Housing Partners', 
    website: 'www.nutmeghousing.com', 
    programType: 'LIHTC', 
    programLevel: 'state', 
    stateProgram: 'CT State LIHTC', 
    allocation: 11000000, 
    creditPrice: 0.89, 
    state: 'Connecticut', 
    city: 'Hartford', 
    tractType: ['QCT', 'DDA'], 
    status: 'available', 
    foundedYear: 2015, 
    submittedDate: '2024-12-02', 
    povertyRate: 27.4, 
    visible: true 
  },
  { 
    id: 'deal-024', 
    projectName: 'Veterans Housing Complex', 
    sponsorName: 'Heroes Home Foundation', 
    website: 'www.heroeshome.org', 
    programType: 'LIHTC', 
    programLevel: 'federal', 
    allocation: 16000000, 
    creditPrice: 0.89, 
    state: 'Virginia', 
    city: 'Norfolk', 
    tractType: ['QCT', 'DDA'], 
    status: 'under_review', 
    foundedYear: 2015, 
    submittedDate: '2024-11-22', 
    visible: true 
  },
  { 
    id: 'deal-025', 
    projectName: 'Waterfront Redevelopment', 
    sponsorName: 'Coastal Development LLC', 
    website: 'www.coastaldev.com', 
    programType: 'OZ', 
    programLevel: 'federal', 
    allocation: 38000000, 
    creditPrice: 0.83, 
    state: 'Maryland', 
    city: 'Annapolis', 
    tractType: ['QCT', 'SD'], 
    status: 'available', 
    foundedYear: 2017, 
    submittedDate: '2024-12-03', 
    povertyRate: 30.2, 
    visible: true 
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get a deal by ID (Async version)
 */
export async function getDealById(id: string): Promise<Deal | undefined> {
  const deal = await fetchSupabaseDealById(id);
  return deal || undefined;
}

/**
 * Get featured deals for homepage (first 4 with full details)
 */
export async function getFeaturedDeals(): Promise<Deal[]> {
  const deals = await fetchDeals();
  return deals.filter(d => 
    d.visible && 
    d.description
  ).slice(0, 4);
}

/**
 * Get deals for marketplace (all visible)
 */
export async function getMarketplaceDeals(): Promise<Deal[]> {
  const deals = await fetchDeals();
  return deals.filter(d => d.visible);
}

/**
 * Get deals by program type
 */
export async function getDealsByProgram(program: ProgramType): Promise<Deal[]> {
  const deals = await fetchDeals();
  return deals.filter(d => d.visible && d.programType === program);
}

/**
 * Get deals by status
 */
export async function getDealsByStatus(status: DealStatus): Promise<Deal[]> {
  const deals = await fetchDeals();
  return deals.filter(d => d.visible && d.status === status);
}

/**
 * Get program statistics
 */
export async function getProgramStats() {
  const deals = await fetchDeals();
  const visible = deals.filter(d => d.visible);
  return {
    nmtc: visible.filter(d => d.programType === 'NMTC').length,
    htc: visible.filter(d => d.programType === 'HTC').length,
    lihtc: visible.filter(d => d.programType === 'LIHTC').length,
    oz: visible.filter(d => d.programType === 'OZ').length,
    federal: visible.filter(d => d.programLevel === 'federal').length,
    state: visible.filter(d => d.programLevel === 'state').length,
    total: visible.length,
    totalAllocation: visible.reduce((sum, d) => sum + d.allocation, 0),
  };
}
