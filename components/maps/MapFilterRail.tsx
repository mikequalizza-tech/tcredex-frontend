'use client';

import { useState, useCallback } from 'react';
import { useCurrentUser } from '@/lib/auth';

interface TractData {
  geoid: string;
  state: string;
  county: string;
  tract: string;
  povertyRate: number;
  medianIncome: number;
  unemploymentRate: number;
  nmtcEligible: boolean;
  severelyDistressed: boolean;
  qct: boolean;
  ozDesignated: boolean;
  stateName?: string;
}

interface MapFilterRailProps {
  viewMode: 'sponsor' | 'cde' | 'investor';
  onViewModeChange: (mode: 'sponsor' | 'cde' | 'investor') => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onTractFound?: (tract: TractData, coordinates: [number, number]) => void;
  autoMatchEnabled: boolean;
  onAutoMatchToggle: (enabled: boolean) => void;
}

export interface FilterState {
  // Credit types
  creditTypes: ('nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield')[];
  // Deal status
  shovelReadyOnly: boolean;
  seekingAllocation: boolean;
  inClosing: boolean;
  // Financial
  minProjectCost: number;
  maxProjectCost: number;
  minAllocation: number;
  maxAllocation: number;
  // Geographic
  states: string[];
  severelyDistressedOnly: boolean;
  qctOnly: boolean;
  // CDE-specific
  cdeMinAllocationRemaining?: number;
  cdeImpactThemes?: string[];
  // Project type
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

// Accordion section component
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
}: MapFilterRailProps) {
  const { isAuthenticated, orgType, userName } = useCurrentUser();
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tractResult, setTractResult] = useState<TractData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Address lookup
  const handleAddressSearch = useCallback(async () => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setTractResult(null);

    try {
      // Step 1: Geocode address to get coordinates and tract
      const geoResponse = await fetch(`/api/geo/tract-lookup?address=${encodeURIComponent(address)}`);
      if (!geoResponse.ok) throw new Error('Geocoding failed');
      const geoData = await geoResponse.json();

      if (!geoData.geoid) {
        throw new Error('Could not determine census tract for this address');
      }

      // Step 2: Get eligibility data for the tract
      const eligibilityResponse = await fetch(`/api/eligibility?geoid=${geoData.geoid}&state=${geoData.state_abbr || ''}`);
      if (!eligibilityResponse.ok) throw new Error('Eligibility lookup failed');
      const eligibilityData = await eligibilityResponse.json();

      const tract: TractData = {
        geoid: geoData.geoid,
        state: geoData.state_abbr || '',
        county: geoData.county || '',
        tract: geoData.tract || geoData.geoid.slice(-6),
        povertyRate: eligibilityData.federal?.poverty_rate || 0,
        medianIncome: eligibilityData.federal?.median_family_income || 0,
        unemploymentRate: eligibilityData.federal?.unemployment_rate || 0,
        nmtcEligible: eligibilityData.federal?.nmtc_eligible || false,
        severelyDistressed: eligibilityData.federal?.severely_distressed || false,
        qct: eligibilityData.federal?.qct || false,
        ozDesignated: eligibilityData.federal?.oz_designated || false,
        stateName: eligibilityData.state?.state_name || geoData.state_abbr,
      };

      setTractResult(tract);
      
      // Notify parent with tract data and coordinates
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

  // Toggle credit type
  const toggleCreditType = (type: 'nmtc' | 'htc' | 'lihtc' | 'oz' | 'brownfield') => {
    const current = filters.creditTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, creditTypes: updated });
  };

  // Toggle boolean filter
  const toggleFilter = (key: keyof FilterState) => {
    onFiltersChange({ ...filters, [key]: !filters[key as keyof FilterState] });
  };

  return (
    <div className="w-80 h-full bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-3 mb-3">
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
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="Enter address..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddressSearch}
                disabled={isSearching || !address.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
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

            {searchError && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-xs text-red-400">{searchError}</p>
              </div>
            )}

            {/* Tract Result */}
            {tractResult && (
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Census Tract</span>
                  <span className="text-sm font-mono text-white">{tractResult.geoid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400">Location</span>
                  <span className="text-sm text-gray-300">{tractResult.county}, {tractResult.state}</span>
                </div>
                
                {/* Eligibility Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {tractResult.nmtcEligible && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-900/50 text-green-400 border border-green-800 rounded-full">
                      NMTC ✓
                    </span>
                  )}
                  {tractResult.severelyDistressed && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-900/50 text-red-400 border border-red-800 rounded-full">
                      Severely Distressed
                    </span>
                  )}
                  {tractResult.qct && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-900/50 text-purple-400 border border-purple-800 rounded-full">
                      QCT
                    </span>
                  )}
                  {tractResult.ozDesignated && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800 rounded-full">
                      OZ
                    </span>
                  )}
                  {!tractResult.nmtcEligible && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700 rounded-full">
                      Not NMTC Eligible
                    </span>
                  )}
                </div>

                {/* Tract Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{tractResult.povertyRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Poverty</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">${(tractResult.medianIncome / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500">MFI</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{tractResult.unemploymentRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Unemploy</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* AutoMatch AI Section */}
        {isAuthenticated && (
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
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoMatchEnabled ? 'translate-x-5' : ''
                  }`}
                />
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

        {/* Credit Type Filters */}
        <AccordionSection
          title="Credit Programs"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          badge={
            <span className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
              {filters.creditTypes.length}
            </span>
          }
          defaultOpen={true}
        >
          <div className="space-y-2">
            {[
              { key: 'nmtc' as const, label: 'NMTC', color: 'green' },
              { key: 'htc' as const, label: 'HTC', color: 'amber' },
              { key: 'lihtc' as const, label: 'LIHTC', color: 'blue' },
              { key: 'oz' as const, label: 'Opportunity Zone', color: 'purple' },
              { key: 'brownfield' as const, label: 'Brownfield', color: 'orange' },
            ].map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.creditTypes.includes(key)}
                  onChange={() => toggleCreditType(key)}
                  className={`w-4 h-4 rounded border-gray-600 bg-gray-800 text-${color}-600 focus:ring-${color}-500 focus:ring-offset-gray-900`}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* Deal Status Filters */}
        <AccordionSection
          title="Deal Status"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.shovelReadyOnly}
                onChange={() => toggleFilter('shovelReadyOnly')}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Shovel Ready Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.seekingAllocation}
                onChange={() => toggleFilter('seekingAllocation')}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Seeking Allocation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.inClosing}
                onChange={() => toggleFilter('inClosing')}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600 focus:ring-amber-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">In Closing</span>
            </label>
          </div>
        </AccordionSection>

        {/* Distress Filters */}
        <AccordionSection
          title="Distress Level"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        >
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.severelyDistressedOnly}
                onChange={() => toggleFilter('severelyDistressedOnly')}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Severely Distressed Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.qctOnly}
                onChange={() => toggleFilter('qctOnly')}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">QCT Only</span>
            </label>
          </div>
        </AccordionSection>

        {/* Role-Specific: CDE Filters */}
        {viewMode === 'cde' && (
          <AccordionSection
            title="CDE Preferences"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            badge={<span className="px-1.5 py-0.5 text-xs bg-purple-900/50 text-purple-300 rounded">CDE</span>}
          >
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Filter deals that match your allocation criteria</p>
              
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Min. Project Size</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="0">Any size</option>
                  <option value="1000000">$1M+</option>
                  <option value="5000000">$5M+</option>
                  <option value="10000000">$10M+</option>
                  <option value="25000000">$25M+</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Impact Theme</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">All themes</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="community">Community Facilities</option>
                  <option value="retail">Healthy Food / Retail</option>
                </select>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Role-Specific: Sponsor Filters */}
        {viewMode === 'sponsor' && (
          <AccordionSection
            title="Find CDEs"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            badge={<span className="px-1.5 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">Sponsor</span>}
          >
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Find CDEs with available allocation in your area</p>
              
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Allocation Available</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="0">Any amount</option>
                  <option value="1000000">$1M+</option>
                  <option value="5000000">$5M+</option>
                  <option value="10000000">$10M+</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-gray-400">CDE Type</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">All types</option>
                  <option value="national">National CDE</option>
                  <option value="regional">Regional CDE</option>
                  <option value="local">Local CDE</option>
                </select>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Project Type */}
        <AccordionSection
          title="Project Type"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <div className="space-y-2">
            {[
              'Real Estate',
              'Operating Business',
              'Mixed Use',
              'Community Facility',
              'Healthcare',
              'Manufacturing',
            ].map((type) => (
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
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{type}</span>
              </label>
            ))}
          </div>
        </AccordionSection>
      </div>

      {/* Footer Actions */}
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
