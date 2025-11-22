export function generateReadinessReport(precheck, preview, recommendations){
  return {
    generatedAt: new Date().toISOString(),
    overallStatus: precheck?.overall || 'unknown',
    distress: precheck?.distress,
    impact: precheck?.impact,
    financial: precheck?.financial,
    topCDE: preview?.cdeMatches?.[0] || null,
    topInvestor: preview?.investorMatches?.[0] || null,
    recommendations
  };
}
