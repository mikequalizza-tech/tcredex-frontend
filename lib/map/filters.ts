// tCredex v1.6 - Map Filters

export interface MapFilters {
  show_nmtc: boolean;
  show_lihtc: boolean;
  show_htc: boolean;
  show_oz: boolean;
  severely_distressed_only: boolean;
  underserved_states_only: boolean;
  min_deal_size?: number;
  max_deal_size?: number;
  states?: string[];
}

export const defaultMapFilters: MapFilters = {
  show_nmtc: true,
  show_lihtc: true,
  show_htc: true,
  show_oz: true,
  severely_distressed_only: false,
  underserved_states_only: false,
};

/**
 * NMTC underserved states (per CDFI Fund)
 */
export const UNDERSERVED_STATES = [
  'AK', 'AR', 'GU', 'HI', 'ID', 'KS', 'ME', 'MS', 
  'MT', 'ND', 'NE', 'NV', 'PR', 'SD', 'VI', 'VT', 
  'WV', 'WY'
] as const;

/**
 * Check if state is underserved
 */
export function isUnderservedState(state: string): boolean {
  return UNDERSERVED_STATES.includes(state as typeof UNDERSERVED_STATES[number]);
}

/**
 * Apply filters to a deal list
 */
export function applyMapFilters<T extends {
  programs: string[];
  state: string;
  total_project_cost: number;
  tract_flags: { severely_distressed: boolean };
}>(deals: T[], filters: MapFilters): T[] {
  return deals.filter(deal => {
    // Program filters
    if (filters.show_nmtc && deal.programs.includes('NMTC')) return true;
    if (filters.show_lihtc && deal.programs.includes('LIHTC')) return true;
    if (filters.show_htc && deal.programs.includes('HTC')) return true;
    if (filters.show_oz && deal.programs.includes('OZ')) return true;
    
    // If no programs selected, show all
    if (!filters.show_nmtc && !filters.show_lihtc && !filters.show_htc && !filters.show_oz) {
      // Continue with other filters
    } else {
      return false; // Didn't match any selected program
    }
    
    // Tract filters
    if (filters.severely_distressed_only && !deal.tract_flags.severely_distressed) {
      return false;
    }
    
    if (filters.underserved_states_only && !isUnderservedState(deal.state)) {
      return false;
    }
    
    // Size filters
    if (filters.min_deal_size && deal.total_project_cost < filters.min_deal_size) {
      return false;
    }
    if (filters.max_deal_size && deal.total_project_cost > filters.max_deal_size) {
      return false;
    }
    
    // State filter
    if (filters.states && filters.states.length > 0 && !filters.states.includes(deal.state)) {
      return false;
    }
    
    return true;
  });
}
