'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/lib/auth';

// Google Maps types
interface PlaceResult {
  formatted_address?: string;
  geometry?: { location?: { lat: () => number; lng: () => number; }; };
  address_components?: Array<{ long_name: string; short_name: string; types: string[]; }>;
}

interface AutocompleteInstance {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => PlaceResult;
}

interface TractData {
  geoid: string;
  state: string;
  county: string;
  tract: string;
  povertyRate: number;
  povertyQualifies: boolean;
  medianIncomePct: number;
  incomeQualifies: boolean;
  unemploymentRate: number;
  unemploymentQualifies: boolean;
  nmtcEligible: boolean;
  lihtcQct: boolean;
  lihtcQct2025: boolean;
  lihtcQct2026: boolean;
  lihtcDda: boolean;
  lihtcDda2025: boolean;
  lihtcDda2026: boolean;
  severelyDistressed: boolean;
  metroStatus: string;
  stateName: string;
  stateNmtc: boolean;
  stateHtc: boolean;
  stateBrownfield: boolean;
  opportunityZone: boolean;
  stackingNotes?: string;
  programs: string[];
}

interface MapFilterRailProps {
  viewMode: 'sponsor' | 'cde' | 'investor';
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onTractFound?: (tract: TractData, coordinates: [number, number]) => void;
  autoMatchEnabled: boolean;
  onAutoMatchToggle: (enabled: boolean) => void;
  onClose?: () => void;
}

export interface FilterState {
  creditTypes: ('nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield')[];
  includeStateCredits: boolean;
  shovelReadyOnly: boolean;
  seekingAllocation: boolean;
  inClosing: boolean;
  preDevelopment: boolean;
  seekingCapitalStack: boolean;
  minProjectCost: number;
  maxProjectCost: number;
  minAllocation: number;
  maxAllocation: number;
  states: string[];
  severelyDistressedOnly: boolean;
  qctOnly: boolean;
  underservedStates: boolean;
  areaType: 'all' | 'urban' | 'rural';
  projectTypes: string[];
  communityImpact: {
    wealthCreation: boolean;
    productsServicesInLIC: boolean;
    productsServicesOutsideLIC: boolean;
    jobCreation: { enabled: boolean; fullTimeMin?: number; partTimeMin?: number; };
    constructionJobs: { enabled: boolean; fullTimeMin?: number; partTimeMin?: number; };
  };
  excludeRelatedParty: boolean;
  allocationRequest: { min?: number; max?: number; };
  cdeMinAllocationRemaining?: number;
  cdeImpactThemes?: string[];
}

export const defaultFilters: FilterState = {
  creditTypes: ['nmtc', 'htc'],
  includeStateCredits: false,
  shovelReadyOnly: false,
  seekingAllocation: true,
  inClosing: false,
  preDevelopment: false,
  seekingCapitalStack: false,
  minProjectCost: 0,
  maxProjectCost: 100000000,
  minAllocation: 0,
  maxAllocation: 50000000,
  states: [],
  severelyDistressedOnly: false,
  qctOnly: false,
  underservedStates: false,
  areaType: 'all',
  projectTypes: [],
  communityImpact: {
    wealthCreation: false,
    productsServicesInLIC: false,
    productsServicesOutsideLIC: false,
    jobCreation: { enabled: false },
    constructionJobs: { enabled: false },
  },
  excludeRelatedParty: false,
  allocationRequest: {},
};

const PROJECT_TYPES = [
  'Real Estate - Commercial', 'Real Estate - Industrial', 'Real Estate - Retail', 'Real Estate - Mixed Use',
  'Operating Business', 'Manufacturing', 'Healthcare / Medical', 'Community Facility', 'Educational',
  'Childcare / Early Learning', 'Food Access / Grocery', 'Energy / Clean Tech', 'Technology / Data Center',
  'Agriculture / Farming', 'Arts / Cultural', 'Hospitality / Hotel', 'Workforce Development', 'Infrastructure',
];

function AccordionSection({ title, icon, defaultOpen = false, children, badge }: { 
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-medium text-gray-200">{title}</span>
          {badge}
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// View mode configuration
const VIEW_MODE_CONFIG = {
  sponsor: {
    label: 'Sponsor View',
    color: 'bg-green-600',
    textColor: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-800/50',
    description: 'Find CDEs with allocation matching your project',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  cde: {
    label: 'CDE View',
    color: 'bg-purple-600',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-800/50',
    description: 'Filter projects by your CDE matching criteria',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  investor: {
    label: 'Investor View',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-800/50',
    description: 'View deals with CRA eligibility & return metrics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function MapFilterRail({
  viewMode,
  filters,
  onFiltersChange,
  onTractFound,
  autoMatchEnabled,
  onAutoMatchToggle,
  onClose,
}: MapFilterRailProps) {
  const { isAuthenticated, isLoading } = useCurrentUser();
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tractResult, setTractResult] = useState<TractData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPlacesLoaded, setIsPlacesLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const currentRequestId = useRef<number>(0);

  const config = VIEW_MODE_CONFIG[viewMode];

  useEffect(() => { setIsMounted(true); }, []);

  // Load Google Places API
  useEffect(() => {
    if (!isMounted) return;
    const win = window as Window & { google?: { maps?: { places?: { Autocomplete: unknown } } } };
    if (win.google?.maps?.places) { setIsPlacesLoaded(true); return; }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) { existingScript.addEventListener('load', () => setIsPlacesLoaded(true)); return; }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsPlacesLoaded(true);
    document.head.appendChild(script);
  }, [isMounted]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isMounted || !isPlacesLoaded || !inputRef.current || autocompleteRef.current) return;
    const win = window as Window & { google?: { maps?: { places?: { Autocomplete: new (input: HTMLInputElement, options: object) => AutocompleteInstance; } } } };
    if (!win.google?.maps?.places) return;
    try {
      autocompleteRef.current = new win.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address'],
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setAddress(place.formatted_address);
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (lat && lng) handleCoordinateLookup(lng, lat);
          else handleAddressSearch(place.formatted_address);
        }
      });
    } catch (error) { console.error('Error initializing autocomplete:', error); }
  }, [isMounted, isPlacesLoaded]);

  const handleCoordinateLookup = useCallback(async (lng: number, lat: number) => {
    const requestId = ++currentRequestId.current;
    setIsSearching(true);
    setSearchError(null);
    try {
      const tractResponse = await fetch(`/api/geo/tract-lookup?lat=${lat}&lng=${lng}`);
      const tractData = await tractResponse.json();
      if (requestId !== currentRequestId.current) return;
      if (!tractResponse.ok || !tractData.geoid) throw new Error(tractData.error || 'Could not determine census tract');
      const eligibilityResponse = await fetch(`/api/eligibility?tract=${tractData.geoid}`);
      if (requestId !== currentRequestId.current) return;
      if (!eligibilityResponse.ok) throw new Error('Eligibility lookup failed');
      const eligibilityData = await eligibilityResponse.json();
      const tract: TractData = {
        geoid: tractData.geoid, state: tractData.state_fips || '', county: tractData.county_fips || '',
        tract: tractData.tract_code || tractData.geoid.slice(-6),
        povertyRate: eligibilityData.federal?.poverty_rate || 0, povertyQualifies: eligibilityData.federal?.poverty_qualifies || false,
        medianIncomePct: eligibilityData.federal?.median_income_pct || 0, incomeQualifies: eligibilityData.federal?.income_qualifies || false,
        unemploymentRate: eligibilityData.federal?.unemployment_rate || 0, unemploymentQualifies: eligibilityData.federal?.unemployment_qualifies || false,
        nmtcEligible: eligibilityData.federal?.nmtc_eligible || false,
        lihtcQct: eligibilityData.federal?.lihtc_qct || false,
        lihtcQct2025: eligibilityData.federal?.lihtc_qct_2025 || false,
        lihtcQct2026: eligibilityData.federal?.lihtc_qct_2026 || false,
        lihtcDda: eligibilityData.federal?.lihtc_dda || false,
        lihtcDda2025: eligibilityData.federal?.lihtc_dda_2025 || false,
        lihtcDda2026: eligibilityData.federal?.lihtc_dda_2026 || false,
        severelyDistressed: eligibilityData.federal?.severely_distressed || false,
        metroStatus: eligibilityData.federal?.metro_status || 'N/A', stateName: eligibilityData.location?.state || tractData.state_name || '',
        stateNmtc: eligibilityData.state?.nmtc || false, stateHtc: eligibilityData.state?.htc || false,
        stateBrownfield: eligibilityData.state?.brownfield || false, opportunityZone: eligibilityData.federal?.opportunity_zone || false,
        stackingNotes: eligibilityData.state?.stacking_notes, programs: eligibilityData.programs || [],
      };
      setTractResult(tract);
      setSearchError(null);
      if (onTractFound) onTractFound(tract, [lng, lat]);
    } catch (error) {
      if (requestId === currentRequestId.current) {
        setSearchError(error instanceof Error ? error.message : 'Lookup failed');
        setTractResult(null);
      }
    } finally { if (requestId === currentRequestId.current) setIsSearching(false); }
  }, [onTractFound]);

  const handleAddressSearch = useCallback(async (searchAddress?: string) => {
    const addrToSearch = searchAddress || address;
    if (!addrToSearch.trim()) return;
    const requestId = ++currentRequestId.current;
    setIsSearching(true);
    setSearchError(null);
    try {
      const geoResponse = await fetch(`/api/geo/tract-lookup?address=${encodeURIComponent(addrToSearch)}`);
      const geoData = await geoResponse.json();
      if (requestId !== currentRequestId.current) return;
      if (!geoResponse.ok || !geoData.geoid) { setSearchError(geoData.error || 'Could not determine census tract'); setTractResult(null); setIsSearching(false); return; }
      const eligibilityResponse = await fetch(`/api/eligibility?tract=${geoData.geoid}`);
      if (requestId !== currentRequestId.current) return;
      if (!eligibilityResponse.ok) throw new Error('Eligibility lookup failed');
      const eligibilityData = await eligibilityResponse.json();
      const tract: TractData = {
        geoid: geoData.geoid, state: geoData.state_fips || '', county: geoData.county_fips || '',
        tract: geoData.tract_code || geoData.geoid.slice(-6),
        povertyRate: eligibilityData.federal?.poverty_rate || 0, povertyQualifies: eligibilityData.federal?.poverty_qualifies || false,
        medianIncomePct: eligibilityData.federal?.median_income_pct || 0, incomeQualifies: eligibilityData.federal?.income_qualifies || false,
        unemploymentRate: eligibilityData.federal?.unemployment_rate || 0, unemploymentQualifies: eligibilityData.federal?.unemployment_qualifies || false,
        nmtcEligible: eligibilityData.federal?.nmtc_eligible || false,
        lihtcQct: eligibilityData.federal?.lihtc_qct || false,
        lihtcQct2025: eligibilityData.federal?.lihtc_qct_2025 || false,
        lihtcQct2026: eligibilityData.federal?.lihtc_qct_2026 || false,
        lihtcDda: eligibilityData.federal?.lihtc_dda || false,
        lihtcDda2025: eligibilityData.federal?.lihtc_dda_2025 || false,
        lihtcDda2026: eligibilityData.federal?.lihtc_dda_2026 || false,
        severelyDistressed: eligibilityData.federal?.severely_distressed || false,
        metroStatus: eligibilityData.federal?.metro_status || 'N/A', stateName: eligibilityData.location?.state || geoData.state_name || '',
        stateNmtc: eligibilityData.state?.nmtc || false, stateHtc: eligibilityData.state?.htc || false,
        stateBrownfield: eligibilityData.state?.brownfield || false, opportunityZone: eligibilityData.federal?.opportunity_zone || false,
        stackingNotes: eligibilityData.state?.stacking_notes, programs: eligibilityData.programs || [],
      };
      setTractResult(tract);
      setSearchError(null);
      if (onTractFound && geoData.coordinates) onTractFound(tract, geoData.coordinates);
    } catch (error) { setSearchError(error instanceof Error ? error.message : 'Search failed'); }
    finally { setIsSearching(false); }
  }, [address, onTractFound]);

  const toggleCreditType = (type: 'nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield') => {
    const current = filters.creditTypes;
    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    onFiltersChange({ ...filters, creditTypes: updated });
  };

  const toggleFilter = (key: keyof FilterState) => {
    onFiltersChange({ ...filters, [key]: !filters[key as keyof FilterState] });
  };

  const updateCommunityImpact = (updates: Partial<FilterState['communityImpact']>) => {
    onFiltersChange({ ...filters, communityImpact: { ...filters.communityImpact, ...updates } });
  };

  const showAuthUI = isMounted && !isLoading && isAuthenticated;

  return (
    <div className="w-80 h-full bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Header with View Mode Badge (NOT a switcher) */}
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center text-white`}>
              {config.icon}
            </div>
            <div>
              <h2 className="font-semibold text-white">Deal Map</h2>
              <p className="text-xs text-gray-500">Census Tract Explorer</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* View Mode Indicator - Locked to User Type */}
        <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${config.color}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
          </div>
          <p className="text-xs text-gray-400">{config.description}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Address Search */}
        <AccordionSection
          title="Address Lookup"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="Enter address..." className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" autoComplete="off" />
              <button onClick={() => handleAddressSearch()} disabled={isSearching || !address.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              </button>
            </div>
            {searchError && !tractResult && !isSearching && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg"><p className="text-xs text-red-400">{searchError}</p></div>
            )}
            {tractResult && (
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                {/* Eligibility Header */}
                <div className={`px-3 py-3 border-b border-gray-700 ${tractResult.nmtcEligible || tractResult.opportunityZone || tractResult.lihtcQct ? 'bg-green-900/30' : 'bg-red-900/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tractResult.nmtcEligible || tractResult.opportunityZone || tractResult.lihtcQct ? 'bg-green-500' : 'bg-red-500'}`}>
                      <span className="text-white text-sm">{tractResult.nmtcEligible || tractResult.opportunityZone || tractResult.lihtcQct ? '✓' : '✗'}</span>
                    </div>
                    <span className={`font-bold text-sm ${tractResult.nmtcEligible || tractResult.opportunityZone || tractResult.lihtcQct ? 'text-green-400' : 'text-red-400'}`}>
                      {tractResult.nmtcEligible || tractResult.opportunityZone || tractResult.lihtcQct ? 'TAX CREDIT ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {/* Federal NMTC + State NMTC if available */}
                    {tractResult.nmtcEligible && <span className="px-2 py-0.5 bg-green-800/50 text-green-300 text-xs rounded">Federal NMTC</span>}
                    {tractResult.stateNmtc && <span className="px-2 py-0.5 bg-green-700/50 text-green-200 text-xs rounded">+ State NMTC</span>}

                    {/* LIHTC QCT with year indicators */}
                    {tractResult.lihtcQct && (
                      <span className="px-2 py-0.5 bg-purple-800/50 text-purple-300 text-xs rounded">
                        LIHTC QCT {tractResult.lihtcQct2025 && tractResult.lihtcQct2026 ? '25/26' : tractResult.lihtcQct2025 ? '2025' : '2026'}
                      </span>
                    )}

                    {/* DDA with year indicators */}
                    {tractResult.lihtcDda && (
                      <span className="px-2 py-0.5 bg-indigo-800/50 text-indigo-300 text-xs rounded">
                        DDA {tractResult.lihtcDda2025 && tractResult.lihtcDda2026 ? '25/26' : tractResult.lihtcDda2025 ? '2025' : '2026'}
                      </span>
                    )}

                    {/* Opportunity Zone */}
                    {tractResult.opportunityZone && <span className="px-2 py-0.5 bg-blue-800/50 text-blue-300 text-xs rounded">Opportunity Zone</span>}

                    {/* Severely Distressed */}
                    {tractResult.severelyDistressed && <span className="px-2 py-0.5 bg-orange-800/50 text-orange-300 text-xs rounded">Severely Distressed</span>}
                  </div>
                </div>

                {/* Census Tract ID */}
                <div className="px-3 py-2 bg-gray-900/50 border-b border-gray-700">
                  <span className="text-gray-500 text-xs">Census Tract: </span>
                  <span className="text-white font-mono font-semibold">{tractResult.geoid}</span>
                  <span className="text-gray-600 text-xs ml-2">({tractResult.stateName})</span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-px bg-gray-700">
                  {/* MFI % */}
                  <div className="bg-gray-800 p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase mb-0.5">MFI %</div>
                    <div className={`text-lg font-bold ${tractResult.incomeQualifies ? 'text-green-400' : 'text-white'}`}>
                      {tractResult.medianIncomePct.toFixed(1)}%
                    </div>
                    {tractResult.incomeQualifies && <div className="text-[9px] text-green-500">≤80% qualifies</div>}
                  </div>

                  {/* Poverty Rate */}
                  <div className="bg-gray-800 p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase mb-0.5">Poverty Rate</div>
                    <div className={`text-lg font-bold ${tractResult.povertyQualifies ? 'text-amber-400' : 'text-white'}`}>
                      {tractResult.povertyRate.toFixed(1)}%
                    </div>
                    {tractResult.povertyQualifies && <div className="text-[9px] text-amber-500">≥20% qualifies</div>}
                  </div>

                  {/* Unemployment Rate */}
                  <div className="bg-gray-800 p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase mb-0.5">Unemployment</div>
                    <div className={`text-lg font-bold ${tractResult.unemploymentQualifies ? 'text-red-400' : 'text-white'}`}>
                      {tractResult.unemploymentRate.toFixed(1)}%
                    </div>
                    {tractResult.unemploymentQualifies && <div className="text-[9px] text-red-500">≥1.5x national avg</div>}
                  </div>

                  {/* LIHTC Basis Boost */}
                  <div className="bg-gray-800 p-2.5">
                    <div className="text-[10px] text-gray-500 uppercase mb-0.5">LIHTC Boost</div>
                    <div className={`text-lg font-bold ${tractResult.severelyDistressed ? 'text-purple-400' : 'text-gray-500'}`}>
                      {tractResult.severelyDistressed ? '130%' : 'N/A'}
                    </div>
                    {tractResult.severelyDistressed && <div className="text-[9px] text-purple-500">Basis boost eligible</div>}
                  </div>
                </div>

                {/* Area Type */}
                <div className="px-3 py-2 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Area Type:</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${tractResult.metroStatus === 'Non-Metro' ? 'bg-amber-900/50 text-amber-300' : 'bg-gray-700 text-gray-300'}`}>
                    {tractResult.metroStatus}
                  </span>
                </div>

                {/* Stacking Notes */}
                {tractResult.stackingNotes && (
                  <div className="px-3 py-2 border-t border-gray-700 bg-indigo-900/20">
                    <div className="text-[10px] text-indigo-400 uppercase mb-1">Stacking Opportunity</div>
                    <p className="text-xs text-gray-300">{tractResult.stackingNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionSection>

        {/* AutoMatch AI */}
        {showAuthUI && (
          <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-indigo-950/30 to-purple-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AutoMatch AI</p>
                  <p className="text-xs text-gray-400">{viewMode === 'sponsor' ? 'Find matching CDEs' : 'Find matching projects'}</p>
                </div>
              </div>
              <button onClick={() => onAutoMatchToggle(!autoMatchEnabled)} className={`relative w-11 h-6 rounded-full transition-colors ${autoMatchEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoMatchEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            {autoMatchEnabled && (
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-0.5 text-xs bg-indigo-900/50 text-indigo-300 rounded">3-Deal Rule</span>
                <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">Impact Scoring</span>
              </div>
            )}
          </div>
        )}

        {/* Credit Programs */}
        <AccordionSection title="Credit Programs" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          badge={<span className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">{filters.creditTypes.length}</span>} defaultOpen={true}>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Federal Credits</p>
            {[{ key: 'nmtc' as const, label: 'NMTC', color: 'text-green-600' }, { key: 'htc' as const, label: 'Historic Tax Credit', color: 'text-amber-600' }].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={filters.creditTypes.includes(key)} onChange={() => toggleCreditType(key)} className={`w-4 h-4 rounded border-gray-600 bg-gray-800 ${color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
              </label>
            ))}
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2">Stackable Credits</p>
            {[{ key: 'lihtc' as const, label: 'LIHTC', color: 'text-purple-600' }, { key: 'oz' as const, label: 'Opportunity Zone', color: 'text-blue-600' }, { key: 'brownfield' as const, label: 'Brownfield', color: 'text-orange-600' }].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={filters.creditTypes.includes(key)} onChange={() => toggleCreditType(key)} className={`w-4 h-4 rounded border-gray-600 bg-gray-800 ${color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
              </label>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={filters.includeStateCredits} onChange={() => onFiltersChange({ ...filters, includeStateCredits: !filters.includeStateCredits })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600" />
                <span className="text-sm text-gray-300 group-hover:text-white">Include State Credits</span>
              </label>
            </div>
          </div>
        </AccordionSection>

        {/* Deal Status */}
        <AccordionSection title="Deal Status" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} defaultOpen={viewMode === 'cde'}>
          <div className="space-y-2">
            {[
              { key: 'preDevelopment' as keyof FilterState, label: 'Pre-Development', color: 'text-yellow-600' },
              { key: 'seekingCapitalStack' as keyof FilterState, label: 'Seeking Capital Stack', color: 'text-orange-600' },
              { key: 'shovelReadyOnly' as keyof FilterState, label: 'Shovel Ready', color: 'text-green-600' },
              { key: 'seekingAllocation' as keyof FilterState, label: 'Seeking Allocation', color: 'text-indigo-600' },
              { key: 'inClosing' as keyof FilterState, label: 'In Closing', color: 'text-purple-600' },
            ].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={!!filters[key]} onChange={() => toggleFilter(key)} className={`w-4 h-4 rounded border-gray-600 bg-gray-800 ${color}`} />
                <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* Distress Level */}
        <AccordionSection title="Distress Level" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.severelyDistressedOnly} onChange={() => toggleFilter('severelyDistressedOnly')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600" /><span className="text-sm text-gray-300 group-hover:text-white">Severely Distressed Only</span></label>
            <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.qctOnly} onChange={() => toggleFilter('qctOnly')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600" /><span className="text-sm text-gray-300 group-hover:text-white">Qualified Census Tract (QCT)</span></label>
            <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.underservedStates} onChange={() => toggleFilter('underservedStates')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600" /><span className="text-sm text-gray-300 group-hover:text-white">Underserved States</span></label>
            <p className="text-xs text-gray-500 ml-7">Non-metro areas & Native American communities</p>
          </div>
        </AccordionSection>

        {/* Area Type */}
        <AccordionSection title="Area Type" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>}>
          <div className="flex gap-2">
            {[{ value: 'all' as const, label: 'All' }, { value: 'urban' as const, label: 'Urban' }, { value: 'rural' as const, label: 'Rural' }].map(({ value, label }) => (
              <button key={value} onClick={() => onFiltersChange({ ...filters, areaType: value })} className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${filters.areaType === value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>{label}</button>
            ))}
          </div>
        </AccordionSection>

        {/* Project Type */}
        <AccordionSection title="Project Type" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          badge={filters.projectTypes.length > 0 ? <span className="px-1.5 py-0.5 text-xs bg-indigo-900 text-indigo-300 rounded">{filters.projectTypes.length}</span> : undefined}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {PROJECT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={filters.projectTypes.includes(type)} onChange={() => { const updated = filters.projectTypes.includes(type) ? filters.projectTypes.filter(t => t !== type) : [...filters.projectTypes, type]; onFiltersChange({ ...filters, projectTypes: updated }); }} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600" />
                <span className="text-sm text-gray-300 group-hover:text-white">{type}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* Community Impact - Show for CDE view */}
        {viewMode === 'cde' && (
          <AccordionSection title="Community Impact" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} defaultOpen={true}>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.communityImpact.wealthCreation} onChange={() => updateCommunityImpact({ wealthCreation: !filters.communityImpact.wealthCreation })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600" /><span className="text-sm text-gray-300 group-hover:text-white">Wealth Creation</span></label>
              <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.communityImpact.productsServicesInLIC} onChange={() => updateCommunityImpact({ productsServicesInLIC: !filters.communityImpact.productsServicesInLIC })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600" /><span className="text-sm text-gray-300 group-hover:text-white">Products/Services in LIC</span></label>
              <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.communityImpact.productsServicesOutsideLIC} onChange={() => updateCommunityImpact({ productsServicesOutsideLIC: !filters.communityImpact.productsServicesOutsideLIC })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600" /><span className="text-sm text-gray-300 group-hover:text-white">Products/Services outside LIC</span></label>
              <div className="pt-2 border-t border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer group mb-2"><input type="checkbox" checked={filters.communityImpact.jobCreation.enabled} onChange={() => updateCommunityImpact({ jobCreation: { ...filters.communityImpact.jobCreation, enabled: !filters.communityImpact.jobCreation.enabled } })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600" /><span className="text-sm text-gray-300 group-hover:text-white">Job Creation</span></label>
                {filters.communityImpact.jobCreation.enabled && (
                  <div className="ml-7 flex gap-3">
                    <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">Full Time</label><input type="number" placeholder="Min" value={filters.communityImpact.jobCreation.fullTimeMin || ''} onChange={(e) => updateCommunityImpact({ jobCreation: { ...filters.communityImpact.jobCreation, fullTimeMin: parseInt(e.target.value) || undefined } })} className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white" /></div>
                    <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">Part Time</label><input type="number" placeholder="Min" value={filters.communityImpact.jobCreation.partTimeMin || ''} onChange={(e) => updateCommunityImpact({ jobCreation: { ...filters.communityImpact.jobCreation, partTimeMin: parseInt(e.target.value) || undefined } })} className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white" /></div>
                  </div>
                )}
              </div>
            </div>
          </AccordionSection>
        )}

        {/* NMTC Allocation Request - CDE only */}
        {viewMode === 'cde' && (
          <AccordionSection title="NMTC Allocation Request" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">Filter by QLICI allocation request size</p>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">Min ($)</label><input type="number" placeholder="1000000" value={filters.allocationRequest.min || ''} onChange={(e) => onFiltersChange({ ...filters, allocationRequest: { ...filters.allocationRequest, min: parseInt(e.target.value) || undefined } })} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">Max ($)</label><input type="number" placeholder="10000000" value={filters.allocationRequest.max || ''} onChange={(e) => onFiltersChange({ ...filters, allocationRequest: { ...filters.allocationRequest, max: parseInt(e.target.value) || undefined } })} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white" /></div>
              </div>
              <p className="text-xs text-gray-600">Small deal funds typically $1-5M per QLICI</p>
            </div>
          </AccordionSection>
        )}

        {/* Compliance */}
        <AccordionSection title="Compliance" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={filters.excludeRelatedParty} onChange={() => toggleFilter('excludeRelatedParty')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600" /><span className="text-sm text-gray-300 group-hover:text-white">Exclude Related Party Deals</span></label>
            <p className="text-xs text-gray-500 ml-7">Transactions with common ownership/management</p>
          </div>
        </AccordionSection>
      </div>

      {/* Footer */}
      <div className="flex-none p-4 border-t border-gray-800 bg-gray-900/50">
        <button onClick={() => onFiltersChange(defaultFilters)} className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Reset All Filters</button>
      </div>
    </div>
  );
}
