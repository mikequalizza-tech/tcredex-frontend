export function matchCDEs(project: ProjectData, cdes: any[]) {
  const results = cdes.map(cde => {
    let score = 0;

    if (cde.states.includes(project.location.state)) score += 30;
    if (cde.acceptsSevereDistress && project.location.severeDistress) score += 25;
    if (cde.acceptsEssentialService && project.impact.essentialService) score += 25;
    if (project.complexity.numCDEs <= 1) score += 10;
    if (project.sponsor.priorNMTCDeals > 0) score += 10;

    return { cde, score };
  });

  return results.sort((a,b) => b.score - a.score);
}
