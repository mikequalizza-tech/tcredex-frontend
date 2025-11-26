export interface ProjectData { /* insert schema above */ }

export function scoreDistress(p: ProjectData): number {
  let score = 0;
  score += p.location.povertyRate * 0.4;
  score += (100 - p.location.medianIncomeRatio) * 0.2;
  score += p.location.unemploymentRate * 0.2;
  if (p.location.severeDistress) score += 15;
  if (p.location.nonMetro) score += 5;
  return Math.min(score, 100);
}

export function scoreImpact(p: ProjectData): number {
  let score = 0;
  score += Math.min(p.impact.jobsCreated / 2, 30);
  score += p.impact.percentLowIncomeServed * 0.2;
  if (p.impact.essentialService) score += 25;
  if (p.impact.catalyticImpact) score += 15;
  if (p.impact.revitalizationArea) score += 10;
  return Math.min(score, 100);
}

export function scoreReadiness(p: ProjectData): number {
  let score = 0;
  score += Math.min(p.readiness.dscr * 20, 35);
  if (p.readiness.siteControl) score += 20;
  if (p.readiness.permitsSecured) score += 10;
  score += Math.max(20 - p.readiness.fundingGapPercent, 0);
  if (p.readiness.otherFinancingCommitted) score += 15;
  return Math.min(score, 100);
}

export function scoreSponsor(p: ProjectData): number {
  let score = 0;
  score += Math.min(p.sponsor.yearsOperating, 40);
  score += Math.min(p.sponsor.netAssets / 1000000, 30);
  score += p.sponsor.priorNMTCDeals * 5;
  if (p.sponsor.managementStrength === "High") score += 10;
  return Math.min(score, 100);
}

export function scoreComplexity(p: ProjectData): number {
  let score = 0;
  score += p.complexity.numCDEs * 10;
  if (p.complexity.stateNMTC) score += 20;
  if (p.complexity.HTC) score += 25;
  if (p.complexity.brownfield) score += 10;
  if (p.complexity.bridgeFinancing) score += 20;
  if (p.complexity.mezzFinancing) score += 15;
  if (p.complexity.intercreditorAgreements) score += 15;
  return Math.min(score, 100);
}

export function totalScore(p: ProjectData): number {
  const d = scoreDistress(p);
  const i = scoreImpact(p);
  const r = scoreReadiness(p);
  const s = scoreSponsor(p);
  const c = scoreComplexity(p);

  return (
    0.30 * d +
    0.25 * i +
    0.20 * r +
    0.15 * s -
    0.10 * c
  );
}

export function classifyTier(score: number): string {
  if (score >= 75) return "Tier 1 - Greenlight";
  if (score >= 60) return "Tier 2 - Review";
  if (score >= 40) return "Tier 3 - Conditional";
  return "Tier 4 - Reject";
}
