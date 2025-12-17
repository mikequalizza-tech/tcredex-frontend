/**
 * State Credit Matcher
 * Queries state_credit_matrix and returns eligible state-level credits
 * based on project state and selected programs.
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export type CreditProgram = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ' | 'Brownfield';

export interface ProjectInput {
  state: string;              // 2-letter state code or full name
  programs: CreditProgram[];  // Selected federal programs
  totalProjectCost?: number;
  qreAmount?: number;         // Qualified Rehabilitation Expenditures (HTC)
}

export interface StateCreditMatch {
  program: string;            // e.g., "MO State HTC"
  state: string;
  creditType: CreditProgram;
  rate: number | null;        // Credit rate percentage
  maxCredit?: number;         // Cap if applicable
  transferable: boolean;
  refundable: boolean;
  stackableWithNMTC: boolean;
  stackableWithFederalHTC: boolean;
  stackableWithLIHTC: boolean;
  notes?: string;
  url?: string;
  tags?: string[];
  expirationDate?: string;    // Program sunset
}

interface RawCreditRow {
  state_name: string;
  state_abbrev?: string;
  is_state_htc?: boolean;
  is_state_nmtc?: boolean;
  is_state_brownfield?: boolean;
  is_state_lihtc?: boolean;
  is_state_oz?: boolean;
  is_state_htc_transferable?: boolean;
  is_state_htc_refundable?: boolean;
  is_state_nmtc_transferable?: boolean;
  is_state_nmtc_refundable?: boolean;
  is_state_brownfield_transferable?: boolean;
  is_state_brownfield_refundable?: boolean;
  state_htc_rate?: number;
  state_nmtc_rate?: number;
  state_brownfield_rate?: number;
  state_htc_notes_url?: string;
  state_nmtc_notes_url?: string;
  state_brownfield_notes_url?: string;
  stacking_notes?: string;
  state_credit_tags?: string[];
  [key: string]: any;
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(url, key);
};

// =============================================================================
// MAIN MATCHER FUNCTION
// =============================================================================

export async function matchEligibleCredits(project: ProjectInput): Promise<StateCreditMatch[]> {
  const supabase = getSupabaseClient();
  const { state, programs } = project;
  
  if (!state || programs.length === 0) {
    return [];
  }

  // Query by state name or abbreviation
  const { data, error } = await supabase
    .from('state_credit_matrix')
    .select('*')
    .or(`state_name.ilike.%${state}%,state_abbrev.ilike.${state}`);

  if (error) {
    console.error('[matchEligibleCredits] Supabase query failed:', error.message);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const matches: StateCreditMatch[] = [];

  for (const row of data as RawCreditRow[]) {
    // Check each program type
    if (programs.includes('HTC') && row.is_state_htc) {
      matches.push(buildCreditMatch(row, 'HTC', project));
    }
    
    if (programs.includes('NMTC') && row.is_state_nmtc) {
      matches.push(buildCreditMatch(row, 'NMTC', project));
    }
    
    if (programs.includes('Brownfield') && row.is_state_brownfield) {
      matches.push(buildCreditMatch(row, 'Brownfield', project));
    }
    
    if (programs.includes('LIHTC') && row.is_state_lihtc) {
      matches.push(buildCreditMatch(row, 'LIHTC', project));
    }
    
    if (programs.includes('OZ') && row.is_state_oz) {
      matches.push(buildCreditMatch(row, 'OZ', project));
    }
  }

  return matches;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildCreditMatch(
  row: RawCreditRow, 
  creditType: CreditProgram,
  project: ProjectInput
): StateCreditMatch {
  const stateAbbrev = row.state_abbrev || row.state_name?.slice(0, 2).toUpperCase();
  
  return {
    program: `${stateAbbrev} State ${creditType}`,
    state: row.state_name || stateAbbrev,
    creditType,
    rate: getRate(row, creditType),
    maxCredit: calculateMaxCredit(row, creditType, project),
    transferable: getTransferability(row, creditType),
    refundable: getRefundability(row, creditType),
    stackableWithNMTC: checkStackability(row.stacking_notes, 'nmtc'),
    stackableWithFederalHTC: checkStackability(row.stacking_notes, 'htc'),
    stackableWithLIHTC: checkStackability(row.stacking_notes, 'lihtc'),
    notes: row.stacking_notes || undefined,
    url: getUrl(row, creditType),
    tags: row.state_credit_tags || undefined,
  };
}

function getRate(row: RawCreditRow, creditType: CreditProgram): number | null {
  switch (creditType) {
    case 'HTC':
      return row.state_htc_rate ?? parseRateFromNotes(row.state_htc_notes_url);
    case 'NMTC':
      return row.state_nmtc_rate ?? parseRateFromNotes(row.state_nmtc_notes_url);
    case 'Brownfield':
      return row.state_brownfield_rate ?? parseRateFromNotes(row.state_brownfield_notes_url);
    default:
      return null;
  }
}

function getTransferability(row: RawCreditRow, creditType: CreditProgram): boolean {
  switch (creditType) {
    case 'HTC':
      return row.is_state_htc_transferable === true;
    case 'NMTC':
      return row.is_state_nmtc_transferable === true;
    case 'Brownfield':
      return row.is_state_brownfield_transferable === true;
    default:
      return false;
  }
}

function getRefundability(row: RawCreditRow, creditType: CreditProgram): boolean {
  switch (creditType) {
    case 'HTC':
      return row.is_state_htc_refundable === true;
    case 'NMTC':
      return row.is_state_nmtc_refundable === true;
    case 'Brownfield':
      return row.is_state_brownfield_refundable === true;
    default:
      return false;
  }
}

function getUrl(row: RawCreditRow, creditType: CreditProgram): string | undefined {
  let notesField: string | undefined;
  
  switch (creditType) {
    case 'HTC':
      notesField = row.state_htc_notes_url;
      break;
    case 'NMTC':
      notesField = row.state_nmtc_notes_url;
      break;
    case 'Brownfield':
      notesField = row.state_brownfield_notes_url;
      break;
  }
  
  if (!notesField) return undefined;
  
  const match = notesField.match(/https?:\/\/[^\s)]+/);
  return match ? match[0] : undefined;
}

function parseRateFromNotes(notes?: string): number | null {
  if (!notes) return null;
  const match = notes.match(/(\d{1,2})%/);
  return match ? parseInt(match[1], 10) : null;
}

function checkStackability(notes: string | undefined, program: string): boolean {
  if (!notes) return false;
  return notes.toLowerCase().includes(program.toLowerCase());
}

function calculateMaxCredit(
  row: RawCreditRow, 
  creditType: CreditProgram, 
  project: ProjectInput
): number | undefined {
  const rate = getRate(row, creditType);
  if (!rate) return undefined;
  
  // For HTC, calculate based on QRE
  if (creditType === 'HTC' && project.qreAmount) {
    return Math.round(project.qreAmount * (rate / 100));
  }
  
  // For other credits, calculate based on total project cost
  if (project.totalProjectCost) {
    return Math.round(project.totalProjectCost * (rate / 100));
  }
  
  return undefined;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get all available state credits for a state (regardless of programs)
 */
export async function getStateCredits(state: string): Promise<StateCreditMatch[]> {
  return matchEligibleCredits({
    state,
    programs: ['NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield'],
  });
}

/**
 * Check if a state has any tax credit programs
 */
export async function hasStateCredits(state: string): Promise<boolean> {
  const credits = await getStateCredits(state);
  return credits.length > 0;
}

/**
 * Get stackable credits for a specific combination
 */
export async function getStackableCredits(
  state: string,
  primaryProgram: CreditProgram
): Promise<StateCreditMatch[]> {
  const allCredits = await getStateCredits(state);
  
  return allCredits.filter((credit) => {
    if (primaryProgram === 'NMTC') return credit.stackableWithNMTC;
    if (primaryProgram === 'HTC') return credit.stackableWithFederalHTC;
    if (primaryProgram === 'LIHTC') return credit.stackableWithLIHTC;
    return true;
  });
}
