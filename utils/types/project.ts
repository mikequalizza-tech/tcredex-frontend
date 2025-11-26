export interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
  censusTract: string;

  povertyRate: number;
  medianIncomeRatio: number;
  unemploymentRate: number;

  severelyDistressed: boolean;
  nonMetro: boolean;
  opportunityZone: boolean;
  qctDda: boolean;

  metadata: {
    licEligible: boolean;
    status: "Urban" | "Rural" | "Tribal" | "Island";
    priorNmtcActivity: boolean;
  };
}

export interface Sponsor {
  name: string;
  entityType: "Nonprofit" | "ForProfit";
  yearsOperating: number;
  netAssets: number;
  priorNMTCDeals: number;
  managementStrength: "Low" | "Medium" | "High";
  guaranteeCapacity: "Low" | "Medium" | "High";
}

export interface QALICB {
  entityName: string;
  entityType: "LLC" | "Nonprofit" | "Corporation" | "Partnership";
  businessType: string;
  naics: string;
  activeConduct: boolean;
  eligibleBusiness: boolean;
}

export interface Impact {
  jobsCreated: number;
  jobsRetained: number;
  percentLowIncomeServed: number;
  essentialService: boolean;
  catalyticImpact: boolean;
  revitalizationArea: boolean;
}

export interface Readiness {
  siteControl: boolean;
  permitsSecured: boolean;
  dscr: number;
  fundingGapPercent: number;
  otherFinancingCommitted: boolean;
}

export interface Complexity {
  numCDEs: number;
  stateNMTC: boolean;
  federalNMTC: boolean;
  htcFederal: boolean;
  htcState: boolean;
  brownfield: boolean;
  bridgeFinancing: boolean;
  mezzFinancing: boolean;
  intercreditorAgreements: boolean;
}

export interface Allocation {
  CDE: string;
  allocationType: "Federal NMTC" | "State NMTC";
  QEI_amount: number;
  investorEquity: number;
  leverageLoan: {
    source: string;
    amount: number;
  };
  pricing: number;
  QLICIs: {
    note: "A" | "B" | "C";
    amount: number;
    interestRate: string;
    forgivable: boolean;
  }[];
}

export interface Credits {
  nmtc: boolean;
  htcFederal: boolean;
  htcState: boolean;
  lihtc: boolean;
  oz: boolean;
}

export interface Scoring {
  distress: number;
  impact: number;
  readiness: number;
  sponsorStrength: number;
  complexity: number;
  totalScore: number;
  tier: "Tier1" | "Tier2" | "Tier3" | "Tier4";
  reasonCodes: string[];
}

export interface Matching {
  recommendedCDEs: string[];
  recommendedInvestors: string[];
  matchStrength: number;
}

export interface Compliance {
  substantiallyAllTest: number;
  qliciQualifiedUses: boolean;
  excludedBusiness: boolean;
  debarmentCheck: boolean;
  annualReportingRequired: boolean;
}

export interface Project {
  projectId: string;
  name: string;
  type: "NMTC" | "HTC" | "LIHTC" | "OZ" | "MULTI_CREDIT";

  location: Location;
  sponsor: Sponsor;
  qalicb: QALICB;

  impact: Impact;
  readiness: Readiness;
  complexity: Complexity;

  allocations: Allocation[];
  credits: Credits;

  scoring: Scoring;
  matching: Matching;
  compliance: Compliance;

  status:
    | "Intake"
    | "Scoring"
    | "Market"
    | "TermSheet"
    | "Closing"
    | "Compliance"
    | "Year7 Unwind";
}
