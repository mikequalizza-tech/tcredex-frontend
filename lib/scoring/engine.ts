/**
 * tCredex 4-Pillar Scoring Engine
 * Based on SECTION_C_Scoring_Engine_Framework.md
 * 
 * Pillars:
 * 1. Economic Distress (0-40 points)
 * 2. Impact Potential (0-35 points) 
 * 3. Project Readiness (0-15 points)
 * 4. Mission Fit (0-10 points)
 * 
 * Total: 100 points
 */

export interface ScoringInput {
  // Location data
  censusTract: string;
  povertyRate: number;
  medianFamilyIncome: number;
  unemploymentRate: number;
  isPersistentPovertyCounty: boolean;
  isNonMetro: boolean;
  
  // Project data
  totalProjectCost: number;
  jobsCreated: number;
  jobsRetained: number;
  housingUnits?: number;
  affordableHousingUnits?: number;
  
  // Readiness indicators
  siteControl: 'owned' | 'under_contract' | 'option' | 'none';
  hasProForma: boolean;
  hasThirdPartyReports: boolean;
  committedSourcesPercent: number;
  timelineRealistic: boolean;
  
  // Mission alignment
  projectType: string;
  targetSector: string[];
  dealSize: number;
  
  // CDE criteria (for mission fit)
  cdeCriteria?: {
    targetSectors: string[];
    geographicFocus: string[];
    minDealSize: number;
    maxDealSize: number;
    requireSeverelyDistressed: boolean;
  };
}

export interface ScoringOutput {
  totalScore: number;
  tier: 1 | 2 | 3; // Greenlight, Watchlist, Defer
  breakdown: {
    economicDistress: {
      score: number;
      maxScore: 40;
      components: {
        povertyPercentile: number;
        mfiScore: number;
        unemploymentPercentile: number;
        persistentPoverty: number;
        nonMetro: number;
        capitalDesert: number;
      };
    };
    impactPotential: {
      score: number;
      maxScore: 35;
      components: {
        jobCreation: number;
        essentialServices: number;
        lowIncomeResidents: number;
        catalyticEffect: number;
        leverage: number;
      };
    };
    projectReadiness: {
      score: number;
      maxScore: 15;
      components: {
        siteControl: number;
        proForma: number;
        thirdPartyReports: number;
        committedSources: number;
        timeline: number;
      };
    };
    missionFit: {
      score: number;
      maxScore: 10;
      components: {
        sectorAlignment: number;
        geographyAlignment: number;
        dealSizeAlignment: number;
      };
    };
  };
  eligibilityFlags: {
    nmtcEligible: boolean;
    severelyDistressed: boolean;
    qualifiedCensusTracts: boolean;
  };
  reasonCodes: string[];
}

/**
 * Calculate Economic Distress Score (0-40 points)
 */
function calculateEconomicDistress(input: ScoringInput): ScoringOutput['breakdown']['economicDistress'] {
  // Poverty rate percentile (0-10 points)
  const povertyPercentile = Math.min(10, (input.povertyRate / 50) * 10);
  
  // MFI vs metro/state (0-10 points) - lower MFI = higher score
  const mfiScore = Math.min(10, Math.max(0, (80 - input.medianFamilyIncome) / 8));
  
  // Unemployment percentile (0-10 points)
  const unemploymentPercentile = Math.min(10, (input.unemploymentRate / 20) * 10);
  
  // Persistent Poverty County (0-3 points)
  const persistentPoverty = input.isPersistentPovertyCounty ? 3 : 0;
  
  // Non-Metro (0-3 points)
  const nonMetro = input.isNonMetro ? 3 : 0;
  
  // Capital Desert Index (0-4 points) - simplified
  const capitalDesert = (input.povertyRate > 20 && input.isNonMetro) ? 4 : 
                       (input.povertyRate > 20) ? 2 : 0;
  
  const score = Math.round(
    0.25 * (povertyPercentile + mfiScore + unemploymentPercentile) + 
    persistentPoverty + nonMetro + capitalDesert
  );
  
  return {
    score: Math.min(40, score),
    maxScore: 40,
    components: {
      povertyPercentile: Math.round(povertyPercentile),
      mfiScore: Math.round(mfiScore),
      unemploymentPercentile: Math.round(unemploymentPercentile),
      persistentPoverty,
      nonMetro,
      capitalDesert
    }
  };
}

/**
 * Calculate Impact Potential Score (0-35 points)
 */
function calculateImpactPotential(input: ScoringInput): ScoringOutput['breakdown']['impactPotential'] {
  // Job creation (0-15 points) - 1 point per 10 jobs per $1M invested
  const jobsPerMillion = (input.jobsCreated + input.jobsRetained) / (input.totalProjectCost / 1000000);
  const jobCreation = Math.min(15, jobsPerMillion * 2);
  
  // Essential services (0-8 points) - healthcare, education, food access
  const essentialServices = ['healthcare', 'education', 'food', 'childcare'].some(service => 
    input.targetSector.some(sector => sector.toLowerCase().includes(service))
  ) ? 8 : 0;
  
  // Low-income residents benefit (0-5 points)
  const lowIncomeResidents = input.affordableHousingUnits ? 
    Math.min(5, (input.affordableHousingUnits / (input.housingUnits || 1)) * 5) : 3;
  
  // Catalytic effect (0-4 points) - simplified
  const catalyticEffect = input.totalProjectCost > 10000000 ? 4 : 
                         input.totalProjectCost > 5000000 ? 2 : 1;
  
  // Leverage (0-3 points) - other funding sources
  const leverage = input.committedSourcesPercent > 70 ? 3 : 
                  input.committedSourcesPercent > 50 ? 2 : 1;
  
  const score = Math.round(jobCreation + essentialServices + lowIncomeResidents + catalyticEffect + leverage);
  
  return {
    score: Math.min(35, score),
    maxScore: 35,
    components: {
      jobCreation: Math.round(jobCreation),
      essentialServices,
      lowIncomeResidents: Math.round(lowIncomeResidents),
      catalyticEffect,
      leverage
    }
  };
}

/**
 * Calculate Project Readiness Score (0-15 points)
 */
function calculateProjectReadiness(input: ScoringInput): ScoringOutput['breakdown']['projectReadiness'] {
  // Site control (0-4 points)
  const siteControlScores = {
    'owned': 4,
    'under_contract': 3,
    'option': 2,
    'none': 0
  };
  const siteControl = siteControlScores[input.siteControl] || 0;
  
  // Completed pro forma (0-3 points)
  const proForma = input.hasProForma ? 3 : 0;
  
  // Third-party reports (0-3 points)
  const thirdPartyReports = input.hasThirdPartyReports ? 3 : 0;
  
  // Committed sources ≥70% (0-3 points)
  const committedSources = input.committedSourcesPercent >= 70 ? 3 : 
                          input.committedSourcesPercent >= 50 ? 2 : 
                          input.committedSourcesPercent >= 30 ? 1 : 0;
  
  // Feasible timeline (0-2 points)
  const timeline = input.timelineRealistic ? 2 : 0;
  
  const score = siteControl + proForma + thirdPartyReports + committedSources + timeline;
  
  return {
    score: Math.min(15, score),
    maxScore: 15,
    components: {
      siteControl,
      proForma,
      thirdPartyReports,
      committedSources,
      timeline
    }
  };
}

/**
 * Calculate Mission Fit Score (0-10 points)
 */
function calculateMissionFit(input: ScoringInput): ScoringOutput['breakdown']['missionFit'] {
  if (!input.cdeCriteria) {
    return {
      score: 5, // Default neutral score
      maxScore: 10,
      components: {
        sectorAlignment: 5,
        geographyAlignment: 0,
        dealSizeAlignment: 0
      }
    };
  }
  
  // Sector alignment (0-4 points)
  const sectorMatch = input.targetSector.some(sector => 
    input.cdeCriteria!.targetSectors.some(cdeSector => 
      sector.toLowerCase().includes(cdeSector.toLowerCase())
    )
  );
  const sectorAlignment = sectorMatch ? 4 : 0;
  
  // Geography alignment (0-3 points) - simplified
  const geographyAlignment = 3; // Assume match for now
  
  // Deal size alignment (0-3 points)
  const dealSizeAlignment = (input.dealSize >= input.cdeCriteria.minDealSize && 
                           input.dealSize <= input.cdeCriteria.maxDealSize) ? 3 : 0;
  
  const score = sectorAlignment + geographyAlignment + dealSizeAlignment;
  
  return {
    score: Math.min(10, score),
    maxScore: 10,
    components: {
      sectorAlignment,
      geographyAlignment,
      dealSizeAlignment
    }
  };
}

/**
 * Determine tier classification based on scores
 */
function calculateTier(distressScore: number, impactScore: number): 1 | 2 | 3 {
  // Tier 1 (Greenlight): Distress ≥70 & Impact ≥65
  if (distressScore >= 28 && impactScore >= 23) { // 70% of 40 and 65% of 35
    return 1;
  }
  
  // Tier 2 (Watchlist): Distress ≥60 OR Impact ≥60
  if (distressScore >= 24 || impactScore >= 21) { // 60% of max scores
    return 2;
  }
  
  // Tier 3 (Defer): Below thresholds
  return 3;
}

/**
 * Main scoring function
 */
export function scoreProject(input: ScoringInput): ScoringOutput {
  const economicDistress = calculateEconomicDistress(input);
  const impactPotential = calculateImpactPotential(input);
  const projectReadiness = calculateProjectReadiness(input);
  const missionFit = calculateMissionFit(input);
  
  const totalScore = economicDistress.score + impactPotential.score + 
                    projectReadiness.score + missionFit.score;
  
  const tier = calculateTier(economicDistress.score, impactPotential.score);
  
  // Eligibility flags
  const eligibilityFlags = {
    nmtcEligible: input.povertyRate >= 20 || input.medianFamilyIncome <= 80,
    severelyDistressed: input.povertyRate >= 30 || input.unemploymentRate >= 15,
    qualifiedCensusTracts: input.povertyRate >= 25
  };
  
  // Reason codes for transparency
  const reasonCodes: string[] = [];
  if (economicDistress.score < 24) reasonCodes.push('LOW_DISTRESS');
  if (impactPotential.score < 21) reasonCodes.push('LOW_IMPACT');
  if (projectReadiness.score < 8) reasonCodes.push('NOT_READY');
  if (missionFit.score < 5) reasonCodes.push('POOR_FIT');
  
  return {
    totalScore,
    tier,
    breakdown: {
      economicDistress,
      impactPotential,
      projectReadiness,
      missionFit
    },
    eligibilityFlags,
    reasonCodes
  };
}

/**
 * Utility function to score a deal from database record
 */
export function scoreDealFromRecord(deal: any, cdeCriteria?: any): ScoringOutput {
  const input: ScoringInput = {
    censusTract: deal.census_tract || '',
    povertyRate: deal.tract_poverty_rate || 0,
    medianFamilyIncome: deal.tract_median_income || 50000,
    unemploymentRate: deal.tract_unemployment || 0,
    isPersistentPovertyCounty: deal.tract_types?.includes('Persistent Poverty') || false,
    isNonMetro: deal.tract_types?.includes('Non-Metro') || false,
    
    totalProjectCost: deal.total_project_cost || 0,
    jobsCreated: deal.jobs_created || 0,
    jobsRetained: deal.jobs_retained || 0,
    housingUnits: deal.housing_units,
    affordableHousingUnits: deal.affordable_housing_units,
    
    siteControl: deal.site_control || 'none',
    hasProForma: !!deal.pro_forma_complete,
    hasThirdPartyReports: !!deal.third_party_reports,
    committedSourcesPercent: deal.committed_capital_pct || 0,
    timelineRealistic: !!deal.projected_completion_date,
    
    projectType: deal.project_type || '',
    targetSector: deal.target_sectors || [],
    dealSize: deal.nmtc_financing_requested || deal.total_project_cost || 0,
    
    cdeCriteria
  };
  
  return scoreProject(input);
}