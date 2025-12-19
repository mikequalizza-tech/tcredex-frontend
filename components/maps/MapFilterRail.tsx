'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/lib/auth';

// Google Maps types (inline to avoid @types/google.maps dependency)
interface PlaceResult {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
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
  onViewModeChange: (mode: 'sponsor' | 'cde' | 'investor') => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onTractFound?: (tract: TractData, coordinates: [number, number]) => void;
  autoMatchEnabled: boolean;
  onAutoMatchToggle: (enabled: boolean) => void;
  onClose?: () => void;
}

export interface FilterState {
  creditTypes: ('nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield')[];
  shovelReadyOnly: boolean;
  seekingAllocation: boolean;
  inClosing: boolean;
  minProjectCost: number;
  maxProjectCost: number;
  minAllocation: number;
  maxAllocation: number;
  states: string[];
  severelyDistressedOnly: boolean;
  qctOnly: boolean;
  cdeMinAllocationRemaining?: number;
  cdeImpactThemes?: string[];
  projectTypes: string[];
}

export const defaultFilters: FilterState = {
  creditTypes: ['nmtc', 'htc', 'lihtc', 'oz', 'brownfield'],
  shovelReadyOnly: false,
  seekingAllocation: true,
  inClosing: false,
  minProjectCost: 0,
  maxProjectCost: 100000000,
  minAllocation: 0,
  maxAllocation: 50000000,
  states: [],
  severelyDistressedOnly: false,
  qctOnly: false,
  projectTypes: [],
};

function AccordionSection({ 
  title, 
  icon, 
  defaultOpen = false, 
  children,
  badge
}: { 
  title: string; 
  icon: React.ReactNode; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-medium text-gray-200">{title}</span>
          {badge}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function MapFilterRail({
  viewMode,
  onViewModeChange,
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
  const currentRequestId = useRef<number>(0); // Track current request to cancel stale ones

  // Handle hydration - only run client-side code after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Google Places API (client-only)
  useEffect(() => {
    if (!isMounted) return;
    
    const win = window as Window & { google?: { maps?: { places?: { Autocomplete: unknown } } } };
    if (win.google?.maps?.places) {
      setIsPlacesLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsPlacesLoaded(true));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not found - using manual address entry');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsPlacesLoaded(true);
    document.head.appendChild(script);
  }, [isMounted]);

  // Initialize autocomplete (client-only)
  useEffect(() => {
    if (!isMounted || !isPlacesLoaded || !inputRef.current || autocompleteRef.current) return;
    
    const win = window as Window & { 
      google?: { 
        maps?: { 
          places?: { 
            Autocomplete: new (input: HTMLInputElement, options: object) => AutocompleteInstance;
          } 
        } 
      } 
    };
    
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
          // Use coordinates from Google Places
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (lat && lng) {
            handleCoordinateLookup(lng, lat);
          } else {
            // Fallback to address lookup
            handleAddressSearch(place.formatted_address);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isMounted, isPlacesLoaded]);

  // Lookup tract by coordinates - routes through our API to avoid CORS
  const handleCoordinateLookup = useCallback(async (lng: number, lat: number) => {
    // Increment request ID to cancel any in-flight requests
    const requestId = ++currentRequestId.current;
    
    setIsSearching(true);
    setSearchError(null);
    // Don't clear tractResult immediately - wait for new result to avoid jiggle

    try {
      // Call our API with coordinates
      const tractResponse = await fetch(`/api/geo/tract-lookup?lat=${lat}&lng=${lng}`);
      const tractData = await tractResponse.json();

      // Check if this request is still current (not superseded by another)
      if (requestId !== currentRequestId.current) {
        console.log('[MapFilterRail] Coordinate lookup superseded, ignoring result');
        return;
      }

      if (!tractResponse.ok || !tractData.geoid) {
        throw new Error(tractData.error || 'Could not determine census tract');
      }

      // Get eligibility data
      const eligibilityResponse = await fetch(`/api/eligibility?tract=${tractData.geoid}`);
      
      // Check again after second API call
      if (requestId !== currentRequestId.current) {
        console.log('[MapFilterRail] Coordinate lookup superseded, ignoring eligibility');
        return;
      }
      
      if (!eligibilityResponse.ok) throw new Error('Eligibility lookup failed');
      const eligibilityData = await eligibilityResponse.json();

      const tract: TractData = {
        geoid: tractData.geoid,
        state: tractData.state_fips || '',
        county: tractData.county_fips || '',
        tract: tractData.tract_code || tractData.geoid.slice(-6),
        povertyRate: eligibilityData.federal?.poverty_rate || 0,
        povertyQualifies: eligibilityData.federal?.poverty_qualifies || false,
        medianIncomePct: eligibilityData.federal?.median_income_pct || 0,
        incomeQualifies: eligibilityData.federal?.income_qualifies || false,
        unemploymentRate: eligibilityData.federal?.unemployment_rate || 0,
        unemploymentQualifies: eligibilityData.federal?.unemployment_qualifies || false,
        nmtcEligible: eligibilityData.federal?.nmtc_eligible || false,
        severelyDistressed: eligibilityData.federal?.severely_distressed || false,
        metroStatus: eligibilityData.federal?.metro_status || 'Unknown',
        stateName: eligibilityData.location?.state || tractData.state_name || '',
        stateNmtc: eligibilityData.state?.nmtc?.available || false,
        stateHtc: eligibilityData.state?.htc?.available || false,
        stateBrownfield: eligibilityData.state?.brownfield?.available || false,
        opportunityZone: eligibilityData.federal?.opportunity_zone || false,
        stackingNotes: eligibilityData.state?.stacking_notes,
        programs: eligibilityData.programs || [],
      };

      setTractResult(tract);
      setSearchError(null); // Clear any previous error on success
      if (onTractFound) {
        onTractFound(tract, [lng, lat]);
      }
    } catch (error) {
      // Only set error if this request is still current
      if (requestId === currentRequestId.current) {
        console.error('Coordinate lookup error:', error);
        setSearchError(error instanceof Error ? error.message : 'Lookup failed');
        setTractResult(null);
      }
    } finally {
      // Only update loading state if this request is still current
      if (requestId === currentRequestId.current) {
        setIsSearching(false);
      }
    }
  }, [onTractFound]);

  // Lookup tract by address - routes through our API
  const handleAddressSearch = useCallback(async (searchAddress?: string) => {
    const addrToSearch = searchAddress || address;
    if (!addrToSearch.trim()) return;
    
    // Increment request ID to cancel any in-flight requests
    const requestId = ++currentRequestId.current;
    
    setIsSearching(true);
    setSearchError(null);
    // Don't clear tractResult immediately - wait for new result to avoid jiggle

    try {
      // Call our API with address parameter
      const geoResponse = await fetch(`/api/geo/tract-lookup?address=${encodeURIComponent(addrToSearch)}`);
      const geoData = await geoResponse.json();

      // Check if this request is still current
      if (requestId !== currentRequestId.current) {
        console.log('[MapFilterRail] Address search superseded, ignoring result');
        return;
      }

      if (!geoResponse.ok || !geoData.geoid) {
        // Don't throw - just set error message and return
        setSearchError(geoData.error || 'Could not determine census tract for this address. Try a more specific address.');
        setTractResult(null); // Only clear on actual error, not during loading
        setIsSearching(false);
        return;
      }

      // Get eligibility data
      const eligibilityResponse = await fetch(`/api/eligibility?tract=${geoData.geoid}`);
      
      // Check again after second API call
      if (requestId !== currentRequestId.current) {
        console.log('[MapFilterRail] Address search superseded, ignoring eligibility');
        return;
      }
      
      if (!eligibilityResponse.ok) throw new Error('Eligibility lookup failed');
      const eligibilityData = await eligibilityResponse.json();

      const tract: TractData = {
        geoid: geoData.geoid,
        state: geoData.state_fips || '',
        county: geoData.county_fips || '',
        tract: geoData.tract_code || geoData.geoid.slice(-6),
        povertyRate: eligibilityData.federal?.poverty_rate || 0,
        povertyQualifies: eligibilityData.federal?.poverty_qualifies || false,
        medianIncomePct: eligibilityData.federal?.median_income_pct || 0,
        incomeQualifies: eligibilityData.federal?.income_qualifies || false,
        unemploymentRate: eligibilityData.federal?.unemployment_rate || 0,
        unemploymentQualifies: eligibilityData.federal?.unemployment_qualifies || false,
        nmtcEligible: eligibilityData.federal?.nmtc_eligible || false,
        severelyDistressed: eligibilityData.federal?.severely_distressed || false,
        metroStatus: eligibilityData.federal?.metro_status || 'Unknown',
        stateName: eligibilityData.location?.state || geoData.state_name || '',
        stateNmtc: eligibilityData.state?.nmtc?.available || false,
        stateHtc: eligibilityData.state?.htc?.available || false,
        stateBrownfield: eligibilityData.state?.brownfield?.available || false,
        opportunityZone: eligibilityData.federal?.opportunity_zone || false,
        stackingNotes: eligibilityData.state?.stacking_notes,
        programs: eligibilityData.programs || [],
      };

      setTractResult(tract);
      setSearchError(null); // Clear any previous error on success
      if (onTractFound && geoData.coordinates) {
        onTractFound(tract, geoData.coordinates);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [address, onTractFound]);

  const toggleCreditType = (type: 'nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield') => {
    const current = filters.creditTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, creditTypes: updated });
  };

  const toggleFilter = (key: keyof FilterState) => {
    onFiltersChange({ ...filters, [key]: !filters[key as keyof FilterState] });
  };

  // Only show auth-dependent UI after mount + auth loaded
  const showAuthUI = isMounted && !isLoading && isAuthenticated;

  return (
    <div className="w-80 h-full bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-white">Deal Map</h2>
              <p className="text-xs text-gray-500">Census Tract Explorer</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Close filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['sponsor', 'cde', 'investor'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {mode === 'sponsor' ? 'Sponsor' : mode === 'cde' ? 'CDE' : 'Investor'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Address Search Section */}
        <AccordionSection
          title="Address Lookup"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                  placeholder="Enter address..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoComplete="off"
                />
                {isMounted && !isPlacesLoaded && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAddressSearch()}
                disabled={isSearching || !address.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              {isMounted && isPlacesLoaded 
                ? 'Type for suggestions or press Enter to search' 
                : 'Enter full address and press Enter'}
            </p>

            {searchError && !tractResult && !isSearching && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-xs text-red-400">{searchError}</p>
              </div>
            )}

            {/* Tract Result - CDFI Format */}
            {tractResult && (
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                <div className={`px-3 py-2 border-b border-gray-700 ${
                  tractResult.nmtcEligible ? 'bg-green-900/30' : 'bg-gray-800'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {tractResult.nmtcEligible && (
                      <span className="text-green-400 font-semibold text-sm">✓ NMTC Qualified</span>
                    )}
                    {tractResult.severelyDistressed && (
                      <span className="text-orange-400 font-medium text-sm">• Severely Distressed</span>
                    )}
                    {tractResult.opportunityZone && (
                      <span className="text-blue-400 font-medium text-sm">• Opportunity Zone</span>
                    )}
                    {!tractResult.nmtcEligible && (
                      <span className="text-gray-400 font-medium text-sm">Not NMTC Eligible</span>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-500">Census Tract:</span>
                    <span className="text-white font-semibold">{tractResult.geoid}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-500">Poverty Rate:</span>
                    <span className="text-white">
                      {tractResult.povertyRate.toFixed(1)}%
                      {tractResult.povertyQualifies && <span className="text-orange-400 ml-1">Distressed</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-500">Median Family:</span>
                    <span className="text-white">
                      {tractResult.medianIncomePct.toFixed(1)}%
                      {tractResult.incomeQualifies && <span className="text-orange-400 ml-1">Distressed</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-500">Unemployment:</span>
                    <span className="text-white">
                      {tractResult.unemploymentRate.toFixed(1)}%
                      {tractResult.unemploymentQualifies && <span className="text-orange-400 ml-1">Distressed</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800">
                    <span className="text-gray-500">Area:</span>
                    <span className="text-white">{tractResult.metroStatus}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">State:</span>
                    <span className="text-white">{tractResult.stateName}</span>
                  </div>
                </div>

                {(tractResult.stateNmtc || tractResult.stateHtc || tractResult.stateBrownfield || tractResult.opportunityZone) && (
                  <div className="px-3 py-2 border-t border-gray-700 bg-gray-900/50">
                    <div className="text-xs text-gray-500 mb-1.5">Available Credits:</div>
                    <div className="flex flex-wrap gap-1">
                      {tractResult.stateNmtc && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-900/50 text-green-400 border border-green-800 rounded">NMTC ✓</span>
                      )}
                      {tractResult.stateHtc && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800 rounded">HTC ✓</span>
                      )}
                      {tractResult.stateBrownfield && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-900/50 text-purple-400 border border-purple-800 rounded">Brownfield ✓</span>
                      )}
                      {tractResult.opportunityZone && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-800 rounded">OZ ✓</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionSection>

        {/* AutoMatch AI Section - ONLY render after client mount + auth loaded */}
        {showAuthUI && (
          <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-indigo-950/30 to-purple-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AutoMatch AI</p>
                  <p className="text-xs text-gray-400">
                    {viewMode === 'cde' ? 'Find matching deals' : 'Find matching CDEs'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onAutoMatchToggle(!autoMatchEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoMatchEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoMatchEnabled ? 'translate-x-5' : ''
                }`} />
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
        <AccordionSection
          title="Credit Programs"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          badge={<span className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">{filters.creditTypes.length}</span>}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {[
              { key: 'nmtc' as const, label: 'NMTC' },
              { key: 'htc' as const, label: 'HTC' },
              { key: 'lihtc' as const, label: 'LIHTC' },
              { key: 'oz' as const, label: 'Opportunity Zone' },
              { key: 'brownfield' as const, label: 'Brownfield' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.creditTypes.includes(key)}
                  onChange={() => toggleCreditType(key)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* Deal Status */}
        <AccordionSection
          title="Deal Status"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.shovelReadyOnly} onChange={() => toggleFilter('shovelReadyOnly')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600" />
              <span className="text-sm text-gray-300 group-hover:text-white">Shovel Ready Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.seekingAllocation} onChange={() => toggleFilter('seekingAllocation')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600" />
              <span className="text-sm text-gray-300 group-hover:text-white">Seeking Allocation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.inClosing} onChange={() => toggleFilter('inClosing')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600" />
              <span className="text-sm text-gray-300 group-hover:text-white">In Closing</span>
            </label>
          </div>
        </AccordionSection>

        {/* Distress Level */}
        <AccordionSection
          title="Distress Level"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.severelyDistressedOnly} onChange={() => toggleFilter('severelyDistressedOnly')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600" />
              <span className="text-sm text-gray-300 group-hover:text-white">Severely Distressed Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={filters.qctOnly} onChange={() => toggleFilter('qctOnly')} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600" />
              <span className="text-sm text-gray-300 group-hover:text-white">QCT Only</span>
            </label>
          </div>
        </AccordionSection>

        {/* Project Type */}
        <AccordionSection
          title="Project Type"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        >
          <div className="space-y-2">
            {['Real Estate', 'Operating Business', 'Mixed Use', 'Community Facility', 'Healthcare', 'Manufacturing'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.projectTypes.includes(type)}
                  onChange={() => {
                    const updated = filters.projectTypes.includes(type)
                      ? filters.projectTypes.filter(t => t !== type)
                      : [...filters.projectTypes, type];
                    onFiltersChange({ ...filters, projectTypes: updated });
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600"
                />
                <span className="text-sm text-gray-300 group-hover:text-white">{type}</span>
              </label>
            ))}
          </div>
        </AccordionSection>
      </div>

      {/* Footer */}
      <div className="flex-none p-4 border-t border-gray-800 bg-gray-900/50">
        <button
          onClick={() => onFiltersChange(defaultFilters)}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
}
