'use client';

import { useState, useCallback, useEffect } from 'react';
import { IntakeData } from '../IntakeShell';
import AddressAutocomplete, { AddressData } from '@/components/ui/AddressAutocomplete';

interface LocationTractProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

interface EligibilityResult {
  eligible: boolean;
  tract: string;
  programs: string[];
  povertyRate: number | null;
  medianIncomePct: number | null;
  unemployment?: number | null;
  reason: string;
  note?: string;
  details?: {
    qualifiesOnPoverty: boolean;
    qualifiesOnIncome: boolean;
    state: string;
    county: string;
    classification: string;
  };
}

export function LocationTract({ data, onChange }: LocationTractProps) {
  const [lookupStage, setLookupStage] = useState<'idle' | 'geocoding' | 'tract' | 'eligibility' | 'done' | 'error'>('idle');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Update multiple fields at once and auto-populate derived data
  const updateFields = useCallback((updates: Partial<IntakeData>) => {
    onChange({ ...data, ...updates });
  }, [data, onChange]);

  // Full auto-lookup pipeline: coordinates → tract → eligibility → auto-populate
  const runAutoLookup = useCallback(async (lat: number, lng: number) => {
    setLookupError(null);
    setEligibilityResult(null);
    
    try {
      // Stage 1: Get census tract from coordinates
      setLookupStage('tract');
      
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`;
      const tractResponse = await fetch(geocodeUrl);
      const tractData = await tractResponse.json();

      if (!tractData.result?.geographies?.['Census Tracts']?.[0]) {
        throw new Error('Could not determine census tract for this location');
      }

      const tractInfo = tractData.result.geographies['Census Tracts'][0];
      const stateFips = tractInfo.STATE;
      const countyFips = tractInfo.COUNTY;
      const tractCode = tractInfo.TRACT;
      const fullTract = `${stateFips}${countyFips}${tractCode}`;

      // Stage 2: Get eligibility data
      setLookupStage('eligibility');
      
      const eligibilityResponse = await fetch(`/api/eligibility?tract=${fullTract}`);
      const eligibility: EligibilityResult = await eligibilityResponse.json();
      
      setEligibilityResult(eligibility);

      // Stage 3: Auto-populate ALL fields
      const tractTypes: ('QCT' | 'SD' | 'LIC' | 'DDA')[] = [];
      
      if (eligibility.eligible) {
        tractTypes.push('LIC'); // Low-Income Community
        
        if (eligibility.programs?.includes('Severely Distressed') || 
            (eligibility.povertyRate && eligibility.povertyRate >= 30)) {
          tractTypes.push('SD');
        }
        
        if (eligibility.povertyRate && eligibility.povertyRate >= 20) {
          tractTypes.push('QCT');
        }
      }

      // Update form with ALL derived data
      updateFields({
        censusTract: fullTract,
        tractType: tractTypes,
        // Store raw metrics for deal card generation
        tractPovertyRate: eligibility.povertyRate ?? undefined,
        tractMedianIncome: eligibility.medianIncomePct ?? undefined,
        tractUnemployment: eligibility.unemployment ?? undefined,
        tractEligible: eligibility.eligible,
        tractSeverelyDistressed: eligibility.programs?.includes('Severely Distressed') || false,
        tractClassification: eligibility.details?.classification,
        tractCounty: eligibility.details?.county,
        tractState: eligibility.details?.state,
        // Auto-set county from eligibility if available
        county: eligibility.details?.county || data.county,
      });

      setLookupStage('done');
      
      // Reset to idle after showing success briefly
      setTimeout(() => setLookupStage('idle'), 2000);

    } catch (error) {
      console.error('Auto-lookup error:', error);
      setLookupError(error instanceof Error ? error.message : 'Lookup failed');
      setLookupStage('error');
    }
  }, [updateFields, data.county]);

  // Handle address selection - triggers full auto-lookup
  const handleAddressSelect = useCallback(async (addressData: AddressData) => {
    setLookupStage('geocoding');
    
    // Update address fields immediately
    updateFields({
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      county: addressData.county,
      // Store coordinates for map
      latitude: addressData.lat,
      longitude: addressData.lng,
    });

    // Auto-run tract lookup if we have coordinates
    if (addressData.lat && addressData.lng) {
      await runAutoLookup(addressData.lat, addressData.lng);
    } else {
      setLookupStage('idle');
    }
  }, [updateFields, runAutoLookup]);

  // Status indicator component
  const StatusIndicator = () => {
    if (lookupStage === 'idle') return null;
    
    const stages = {
      geocoding: { text: 'Getting coordinates...', icon: '📍' },
      tract: { text: 'Finding census tract...', icon: '🗺️' },
      eligibility: { text: 'Checking NMTC eligibility...', icon: '🔍' },
      done: { text: 'Complete!', icon: '✅' },
      error: { text: lookupError || 'Error', icon: '❌' },
    };
    
    const stage = stages[lookupStage];
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        lookupStage === 'done' ? 'bg-green-900/30 text-green-300' :
        lookupStage === 'error' ? 'bg-red-900/30 text-red-300' :
        'bg-indigo-900/30 text-indigo-300'
      }`}>
        {lookupStage !== 'done' && lookupStage !== 'error' && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <span>{stage.icon}</span>
        <span>{stage.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Address Input - Primary action */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Address <span className="text-red-400">*</span>
        </label>
        <AddressAutocomplete
          value={data.address}
          onChange={handleAddressSelect}
          placeholder="Start typing address... (auto-fills everything)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type and select address → City, State, ZIP, Census Tract, and eligibility auto-populate
        </p>
        
        {/* Inline status indicator */}
        <div className="mt-2">
          <StatusIndicator />
        </div>
      </div>

      {/* Auto-filled Address Fields - Read-only appearance but editable */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => updateFields({ city: e.target.value })}
            placeholder="Auto-filled"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
          <select
            value={data.state || ''}
            onChange={(e) => updateFields({ state: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100"
          >
            <option value="">Auto-filled</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ZIP</label>
          <input
            type="text"
            value={data.zipCode || ''}
            onChange={(e) => updateFields({ zipCode: e.target.value })}
            placeholder="Auto-filled"
            maxLength={10}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">County</label>
          <input
            type="text"
            value={data.county || data.tractCounty || ''}
            onChange={(e) => updateFields({ county: e.target.value })}
            placeholder="Auto-filled"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Census Tract & Eligibility - Auto-populated */}
      {(data.censusTract || eligibilityResult) && (
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          {/* Header with tract number */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="text-sm text-gray-400">Census Tract</div>
                <div className="text-xl font-mono text-gray-100">{data.censusTract || '—'}</div>
              </div>
            </div>
            {eligibilityResult && (
              <div className={`px-4 py-2 rounded-lg font-medium ${
                eligibilityResult.eligible 
                  ? 'bg-green-600 text-white' 
                  : 'bg-yellow-600 text-white'
              }`}>
                {eligibilityResult.eligible ? '✓ NMTC Eligible' : '⚠ Not Eligible'}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          {eligibilityResult && (
            <div className="p-4 bg-gray-900/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Poverty Rate</div>
                  <div className="text-2xl font-bold text-red-400">
                    {eligibilityResult.povertyRate !== null ? `${eligibilityResult.povertyRate}%` : '—'}
                  </div>
                  {eligibilityResult.povertyRate !== null && eligibilityResult.povertyRate >= 20 && (
                    <div className="text-xs text-green-400 mt-1">✓ Qualifies ≥20%</div>
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Median Income</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {eligibilityResult.medianIncomePct !== null ? `${eligibilityResult.medianIncomePct}%` : '—'}
                  </div>
                  {eligibilityResult.medianIncomePct !== null && eligibilityResult.medianIncomePct <= 80 && (
                    <div className="text-xs text-green-400 mt-1">✓ Qualifies ≤80%</div>
                  )}
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Unemployment</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {eligibilityResult.unemployment !== null && eligibilityResult.unemployment !== undefined 
                      ? `${eligibilityResult.unemployment}%` 
                      : '—'}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Classification</div>
                  <div className="text-lg font-bold text-purple-400">
                    {eligibilityResult.details?.classification || '—'}
                  </div>
                </div>
              </div>

              {/* Qualification Badges */}
              <div className="flex flex-wrap gap-2">
                {data.tractType?.includes('LIC') && (
                  <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                    ✓ Low-Income Community
                  </span>
                )}
                {data.tractType?.includes('QCT') && (
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                    ✓ Qualified Census Tract
                  </span>
                )}
                {data.tractType?.includes('SD') && (
                  <span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm font-medium border border-red-500/30">
                    ★ Severely Distressed
                  </span>
                )}
                {eligibilityResult.details?.qualifiesOnPoverty && eligibilityResult.details?.qualifiesOnIncome && (
                  <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                    ★ High Priority (Dual Qualification)
                  </span>
                )}
              </div>

              {/* Eligibility reason */}
              <p className="text-sm text-gray-400 mt-4">{eligibilityResult.reason}</p>
              {eligibilityResult.note && (
                <p className="text-xs text-gray-500 mt-1">{eligibilityResult.note}</p>
              )}
            </div>
          )}

          {/* Manual override section - collapsed by default */}
          {!eligibilityResult && data.censusTract && (
            <div className="p-4 bg-gray-900/50 text-center text-gray-500">
              <p className="text-sm">Eligibility data loading...</p>
            </div>
          )}
        </div>
      )}

      {/* Error state with retry option */}
      {lookupStage === 'error' && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">Lookup Error</p>
              <p className="text-sm text-red-400 mt-1">{lookupError}</p>
              <p className="text-xs text-gray-500 mt-2">
                You can manually enter the census tract below, or try a different address.
              </p>
            </div>
          </div>
          
          {/* Manual tract entry */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Manual Census Tract Entry
            </label>
            <input
              type="text"
              value={data.censusTract || ''}
              onChange={(e) => updateFields({ censusTract: e.target.value })}
              placeholder="11-digit FIPS code (e.g., 17031839100)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Help text when no address entered */}
      {!data.address && !data.censusTract && lookupStage === 'idle' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-gray-300 font-medium">Enter Project Address Above</p>
          <p className="text-sm text-gray-500 mt-1">
            Select from dropdown to auto-populate all location data and eligibility metrics
          </p>
        </div>
      )}
    </div>
  );
}

export default LocationTract;
