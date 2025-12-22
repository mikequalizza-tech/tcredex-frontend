/**
 * tCredex Intake Tier Progression System
 * 
 * Progressive disclosure: fields unlock as deal advances
 * 
 * Tier 1 (Initial)    → Basic info for Deal Card + Section C Score
 * Tier 2 (LOI Issued) → Additional details for CDE allocation decision
 * Tier 3 (Commitment) → Full due diligence for investor underwriting
 * Tier 4 (Closing)    → Final verification for closing room
 */

// =============================================================================
// TIER DEFINITIONS
// =============================================================================

export type IntakeTier = 1 | 2 | 3 | 4;

export const TIER_NAMES: Record<IntakeTier, string> = {
  1: 'Initial Submission',
  2: 'LOI Stage',
  3: 'Commitment Stage',
  4: 'Closing Stage',
};

export const TIER_DESCRIPTIONS: Record<IntakeTier, string> = {
  1: 'Basic project info for marketplace listing and initial scoring',
  2: 'Detailed financials and site info for CDE allocation decision',
  3: 'Full due diligence package for investor underwriting',
  4: 'Final verification and closing documentation',
};

export const TIER_TRIGGERS: Record<IntakeTier, string> = {
  1: 'Deal submitted',
  2: 'LOI issued by CDE',
  3: 'Commitment issued by investor',
  4: 'All parties accepted, closing room opened',
};

// =============================================================================
// FIELD CATEGORIES
// =============================================================================

export type FieldCategory =
  | 'project_basics'
  | 'location'
  | 'financials'
  | 'sources_uses'
  | 'jobs_impact'
  | 'site_control'
  | 'third_party_reports'
  | 'legal_structure'
  | 'sponsor_background'
  | 'closing_docs';

export const CATEGORY_LABELS: Record<FieldCategory, string> = {
  project_basics: 'Project Basics',
  location: 'Location & Census Tract',
  financials: 'Financial Summary',
  sources_uses: 'Sources & Uses',
  jobs_impact: 'Jobs & Community Impact',
  site_control: 'Site Control',
  third_party_reports: 'Third Party Reports',
  legal_structure: 'Legal Structure',
  sponsor_background: 'Sponsor Background',
  closing_docs: 'Closing Documentation',
};

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export interface FieldDefinition {
  key: string;
  label: string;
  category: FieldCategory;
  type: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'textarea' | 'address';
  required_at_tier: IntakeTier;
  visible_at_tier: IntakeTier;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help_text?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Function name for custom validation
  };
  depends_on?: {
    field: string;
    value: unknown;
  };
}

// =============================================================================
// TIER 1 FIELDS - Initial Submission (Deal Card + Scoring)
// =============================================================================

export const TIER_1_FIELDS: FieldDefinition[] = [
  // Project Basics
  {
    key: 'project_name',
    label: 'Project Name',
    category: 'project_basics',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
    placeholder: 'e.g., Downtown Health Center',
  },
  {
    key: 'project_description',
    label: 'Project Description',
    category: 'project_basics',
    type: 'textarea',
    required_at_tier: 1,
    visible_at_tier: 1,
    placeholder: 'Brief description of the project and its community impact',
  },
  {
    key: 'project_type',
    label: 'Project Type',
    category: 'project_basics',
    type: 'select',
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [
      { value: 'healthcare', label: 'Healthcare Facility' },
      { value: 'education', label: 'Educational Facility' },
      { value: 'childcare', label: 'Childcare Center' },
      { value: 'food_access', label: 'Food Access / Grocery' },
      { value: 'community_facility', label: 'Community Facility' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'mixed_use', label: 'Mixed-Use' },
      { value: 'housing', label: 'Housing (for-sale only)' },
      { value: 'retail', label: 'Retail' },
      { value: 'hospitality', label: 'Hospitality' },
      { value: 'office', label: 'Office' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'sponsor_name',
    label: 'Sponsor / Developer Name',
    category: 'project_basics',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: 'sponsor_email',
    label: 'Sponsor Email',
    category: 'project_basics',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: 'sponsor_phone',
    label: 'Sponsor Phone',
    category: 'project_basics',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  
  // Location
  {
    key: 'project_address',
    label: 'Project Address',
    category: 'location',
    type: 'address',
    required_at_tier: 1,
    visible_at_tier: 1,
    help_text: 'Full street address for geocoding',
  },
  {
    key: 'city',
    label: 'City',
    category: 'location',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: 'state',
    label: 'State',
    category: 'location',
    type: 'select',
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [], // Populated dynamically
  },
  {
    key: 'zip_code',
    label: 'ZIP Code',
    category: 'location',
    type: 'text',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  
  // Financials (basic)
  {
    key: 'total_project_cost',
    label: 'Total Project Cost',
    category: 'financials',
    type: 'currency',
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 100000 },
  },
  {
    key: 'nmtc_request',
    label: 'NMTC Allocation Request',
    category: 'financials',
    type: 'currency',
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 1000000 },
    help_text: 'Minimum $1M allocation',
  },
  
  // Jobs & Impact (basic)
  {
    key: 'permanent_jobs',
    label: 'Permanent Jobs Created/Retained',
    category: 'jobs_impact',
    type: 'number',
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 0 },
  },
  {
    key: 'construction_jobs',
    label: 'Construction Jobs',
    category: 'jobs_impact',
    type: 'number',
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 0 },
  },
  
  // Site Control (basic)
  {
    key: 'site_control_status',
    label: 'Site Control Status',
    category: 'site_control',
    type: 'select',
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [
      { value: 'owned', label: 'Owned' },
      { value: 'under_contract', label: 'Under Contract' },
      { value: 'option_loi', label: 'Option / LOI' },
      { value: 'identified', label: 'Site Identified' },
      { value: 'none', label: 'No Site Yet' },
    ],
  },
  
  // Timeline
  {
    key: 'target_closing_date',
    label: 'Target Closing Date',
    category: 'project_basics',
    type: 'date',
    required_at_tier: 1,
    visible_at_tier: 1,
  },
];

// =============================================================================
// TIER 2 FIELDS - LOI Stage (CDE Decision)
// =============================================================================

export const TIER_2_FIELDS: FieldDefinition[] = [
  // Enhanced Financials
  {
    key: 'acquisition_cost',
    label: 'Acquisition Cost',
    category: 'financials',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'hard_costs',
    label: 'Hard Costs (Construction)',
    category: 'financials',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'soft_costs',
    label: 'Soft Costs',
    category: 'financials',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'contingency',
    label: 'Contingency',
    category: 'financials',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'financing_costs',
    label: 'Financing Costs',
    category: 'financials',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  
  // Sources
  {
    key: 'senior_debt',
    label: 'Senior Debt',
    category: 'sources_uses',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'senior_debt_lender',
    label: 'Senior Debt Lender',
    category: 'sources_uses',
    type: 'text',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'senior_debt_status',
    label: 'Senior Debt Status',
    category: 'sources_uses',
    type: 'select',
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: 'committed', label: 'Committed' },
      { value: 'term_sheet', label: 'Term Sheet' },
      { value: 'application', label: 'Application Submitted' },
      { value: 'discussions', label: 'In Discussions' },
      { value: 'not_started', label: 'Not Started' },
    ],
  },
  {
    key: 'equity_amount',
    label: 'Sponsor Equity',
    category: 'sources_uses',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'other_sources',
    label: 'Other Sources',
    category: 'sources_uses',
    type: 'currency',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'other_sources_description',
    label: 'Other Sources Description',
    category: 'sources_uses',
    type: 'textarea',
    required_at_tier: 2,
    visible_at_tier: 2,
    depends_on: { field: 'other_sources', value: { gt: 0 } },
  },
  
  // Enhanced Impact
  {
    key: 'serves_lmi_directly',
    label: 'Directly Serves LMI Residents?',
    category: 'jobs_impact',
    type: 'boolean',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'lmi_service_description',
    label: 'LMI Service Description',
    category: 'jobs_impact',
    type: 'textarea',
    required_at_tier: 2,
    visible_at_tier: 2,
    depends_on: { field: 'serves_lmi_directly', value: true },
  },
  {
    key: 'employs_lmi_residents',
    label: 'Will Employ LMI Residents?',
    category: 'jobs_impact',
    type: 'boolean',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'community_support_letters',
    label: 'Has Community Support Letters?',
    category: 'jobs_impact',
    type: 'boolean',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  
  // Third Party Reports Status
  {
    key: 'has_pro_forma',
    label: 'Pro Forma Available?',
    category: 'third_party_reports',
    type: 'boolean',
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: 'phase_i_status',
    label: 'Phase I ESA Status',
    category: 'third_party_reports',
    type: 'select',
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: 'complete', label: 'Complete' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'ordered', label: 'Ordered' },
      { value: 'not_started', label: 'Not Started' },
    ],
  },
  {
    key: 'appraisal_status',
    label: 'Appraisal Status',
    category: 'third_party_reports',
    type: 'select',
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: 'complete', label: 'Complete' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'ordered', label: 'Ordered' },
      { value: 'not_started', label: 'Not Started' },
    ],
  },
];

// =============================================================================
// TIER 3 FIELDS - Commitment Stage (Investor Underwriting)
// =============================================================================

export const TIER_3_FIELDS: FieldDefinition[] = [
  // Legal Structure
  {
    key: 'borrower_entity_name',
    label: 'Borrower Entity Name',
    category: 'legal_structure',
    type: 'text',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'borrower_entity_type',
    label: 'Borrower Entity Type',
    category: 'legal_structure',
    type: 'select',
    required_at_tier: 3,
    visible_at_tier: 3,
    options: [
      { value: 'llc', label: 'LLC' },
      { value: 'corporation', label: 'Corporation' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'nonprofit', label: 'Non-Profit' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'borrower_state_of_formation',
    label: 'State of Formation',
    category: 'legal_structure',
    type: 'select',
    required_at_tier: 3,
    visible_at_tier: 3,
    options: [], // Populated dynamically
  },
  {
    key: 'borrower_ein',
    label: 'Borrower EIN',
    category: 'legal_structure',
    type: 'text',
    required_at_tier: 3,
    visible_at_tier: 3,
    validation: { pattern: '^\\d{2}-\\d{7}$' },
    placeholder: 'XX-XXXXXXX',
  },
  
  // Sponsor Background
  {
    key: 'sponsor_entity_name',
    label: 'Sponsor Entity Name',
    category: 'sponsor_background',
    type: 'text',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'sponsor_years_experience',
    label: 'Years of Development Experience',
    category: 'sponsor_background',
    type: 'number',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'sponsor_prior_nmtc',
    label: 'Prior NMTC Experience?',
    category: 'sponsor_background',
    type: 'boolean',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'sponsor_prior_nmtc_count',
    label: 'Number of Prior NMTC Deals',
    category: 'sponsor_background',
    type: 'number',
    required_at_tier: 3,
    visible_at_tier: 3,
    depends_on: { field: 'sponsor_prior_nmtc', value: true },
  },
  {
    key: 'sponsor_financial_statements',
    label: 'Sponsor Financial Statements',
    category: 'sponsor_background',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
    help_text: 'Last 2 years of audited financials',
  },
  
  // Complete Third Party Reports
  {
    key: 'phase_i_report',
    label: 'Phase I ESA Report',
    category: 'third_party_reports',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'appraisal_report',
    label: 'Appraisal Report',
    category: 'third_party_reports',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'market_study',
    label: 'Market Study',
    category: 'third_party_reports',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'title_commitment',
    label: 'Title Commitment',
    category: 'third_party_reports',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: 'survey',
    label: 'Survey',
    category: 'third_party_reports',
    type: 'file',
    required_at_tier: 3,
    visible_at_tier: 3,
  },
];

// =============================================================================
// TIER 4 FIELDS - Closing Stage (Final Verification)
// =============================================================================

export const TIER_4_FIELDS: FieldDefinition[] = [
  // Closing Documentation
  {
    key: 'final_sources_uses',
    label: 'Final Sources & Uses',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'final_pro_forma',
    label: 'Final Pro Forma',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'organizational_docs',
    label: 'Organizational Documents',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
    help_text: 'Operating Agreement, Articles, etc.',
  },
  {
    key: 'senior_loan_commitment',
    label: 'Senior Loan Commitment Letter',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'insurance_certificates',
    label: 'Insurance Certificates',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'construction_contract',
    label: 'Construction Contract',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'permits_approvals',
    label: 'Permits & Approvals',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  
  // Final Verification
  {
    key: 'qalicb_certification',
    label: 'QALICB Certification Signed',
    category: 'closing_docs',
    type: 'boolean',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: 'community_impact_plan_final',
    label: 'Final Community Impact Plan',
    category: 'closing_docs',
    type: 'file',
    required_at_tier: 4,
    visible_at_tier: 4,
  },
];

// =============================================================================
// ALL FIELDS COMBINED
// =============================================================================

export const ALL_INTAKE_FIELDS: FieldDefinition[] = [
  ...TIER_1_FIELDS,
  ...TIER_2_FIELDS,
  ...TIER_3_FIELDS,
  ...TIER_4_FIELDS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getFieldsForTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter(f => f.visible_at_tier <= tier);
}

export function getRequiredFieldsForTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter(f => f.required_at_tier <= tier);
}

export function getNewFieldsAtTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter(f => f.visible_at_tier === tier);
}

export function getFieldsByCategory(tier: IntakeTier): Record<FieldCategory, FieldDefinition[]> {
  const fields = getFieldsForTier(tier);
  const result: Record<FieldCategory, FieldDefinition[]> = {} as any;
  
  for (const category of Object.keys(CATEGORY_LABELS) as FieldCategory[]) {
    result[category] = fields.filter(f => f.category === category);
  }
  
  return result;
}

export function getFieldByKey(key: string): FieldDefinition | undefined {
  return ALL_INTAKE_FIELDS.find(f => f.key === key);
}
