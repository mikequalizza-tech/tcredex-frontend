export interface Project {
  state: string;
  severely_distressed: boolean;
  programs: string[];
  impact_score: number;
  project_type: string;
}

export interface CDEProfile {
  focus_state: string;
  programs: string[];
  preferred_type: string;
}

export function calculateMatchScore(project: Project, cdeProfile: CDEProfile): number {
  let score = 0;

  // Geographic match
  if (project.state === cdeProfile.focus_state) score += 20;
  
  // Severely distressed bonus
  if (project.severely_distressed) score += 25;
  
  // Program alignment
  if (project.programs.includes('NMTC') && cdeProfile.programs.includes('NMTC')) score += 25;
  if (project.programs.includes('HTC') && cdeProfile.programs.includes('HTC')) score += 10;
  if (project.programs.includes('LIHTC') && cdeProfile.programs.includes('LIHTC')) score += 10;
  
  // Impact score bonus
  if (project.impact_score >= 75) score += 20;
  else if (project.impact_score >= 50) score += 10;
  
  // Project type match
  if (project.project_type === cdeProfile.preferred_type) score += 10;

  return Math.min(score, 100);
}

export function getMatchTier(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}
