export function routeToCDEs(project, matchedCDEs){
  return matchedCDEs.map(cde=>({
    cdeId: cde.id || cde.cde?.id || 'unknown',
    projectId: project.id,
    status: 'pending-review',
    assignedAt: new Date().toISOString()
  }));
}
