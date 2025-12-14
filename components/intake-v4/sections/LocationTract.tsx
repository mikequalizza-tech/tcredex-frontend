'use client';

import { useState, useCallback } from 'react';
import { IntakeData } from '../IntakeShell';
import AddressAutocomplete, { AddressData } from '@/components/ui/AddressAutocomplete';

interface LocationTractProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

const TRACT_TYPES = [
  { id: 'QCT', label: 'Qualified Census Tract', description: 'Poverty rate ≥ 20% or median income ≤ 80% AMI' },
  { id: 'SD', label: 'Severely Distressed', description: 'Poverty rate ≥ 30% (extra credit boost)' },
  { id: 'LIC', label: 'Low-Income Community', description: 'Meets NMTC eligibility thresholds' },
  { id: 'DDA', label: 'Difficult Development Area', description: 'High construction costs relative to income' },
];

interface EligibilityResult {
  eligible: boolean;
  tract: string;
  programs: string[];
  povertyRate: number | null;
  medianIncomePct: number | null;
  reason: string;
  note?: string;
}

export function LocationTract({ data, onChange }: LocationTractProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const updateField = (field: keyof IntakeData, value: any) => onChange({ ...data, [field]: value });

  const updateMultipleFields = useCallback((updates: Partial<IntakeData>) => {
    onChange({ ...data, ...updates });
  }, [data, onChange]);

  const toggleTractType = (type: string) => {
    const current = data.tractType || [];
    if (current.includes(type as any)) updateField('tractType', current.filter(t => t !== type));
    else updateField('tractType', [...current, type]);
  };

  // Census tract lookup using Census Geocoder API
  const lookupCensusTract = useCallback(async (lat: number, lng: number) => {
    setIsLookingUp(true);
    setLookupError(null);
    setEligibilityResult(null);

    try {
      // Use Census Bureau Geocoder API for tract lookup
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`;
      
      const response = await fetch(geocodeUrl);
      const geoData = await response.json();

      if (geoData.result?.geographies?.['Census Tracts']?.[0]) {
        const tractInfo = geoData.result.geographies['Census Tracts'][0];
        const stateFips = tractInfo.STATE;
        const countyFips = tractInfo.COUNTY;
        const tractCode = tractInfo.TRACT;
        const fullTract = `${stateFips}${countyFips}${tractCode}`;

        // Update the census tract field
        updateField('censusTract', fullTract);

        // Now check eligibility
        const eligibilityResponse = await fetch(`/api/eligibility?tract=${fullTract}`);
        const eligibilityData: EligibilityResult = await eligibilityResponse.json();
        
        setEligibilityResult(eligibilityData);

        // Auto-set tract types based on eligibility
        if (eligibilityData.eligible && eligibilityData.programs) {
          const tractTypes: ('QCT' | 'SD' | 'LIC' | 'DDA')[] = [];
          if (eligibilityData.programs.includes('NMTC')) tractTypes.push('LIC');
          if (eligibilityData.programs.includes('Severely Distressed')) tractTypes.push('SD');
          if (eligibilityData.povertyRate && eligibilityData.povertyRate >= 20) tractTypes.push('QCT');
          updateField('tractType', tractTypes);
        }
      } else {
        setLookupError('Could not determine census tract for this location');
      }
    } catch (error) {
      console.error('Census tract lookup error:', error);
      setLookupError('Failed to lookup census tract. Please enter manually.');
    } finally {
      setIsLookingUp(false);
    }
  }, [updateField]);

  // Handle address selection from autocomplete
  const handleAddressSelect = useCallback(async (addressData: AddressData) => {
    // Update all address fields at once
    updateMultipleFields({
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
    });

    // Auto-lookup census tract if we have coordinates
    if (addressData.lat && addressData.lng) {
      await lookupCensusTract(addressData.lat, addressData.lng);
    }
  }, [updateMultipleFields, lookupCensusTract]);

  // Manual lookup button handler
  const handleManualLookup = async () => {
    if (!data.address || !data.city || !data.state) {
      setLookupError('Please enter address, city, and state first');
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);

    try {
      // Geocode the address to get coordinates
      const address = encodeURIComponent(`${data.address}, ${data.city}, ${data.state} ${data.zipCode || ''}`);
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${address}&benchmark=Public_AR_Current&format=json`;
      
      const response = await fetch(geocodeUrl);
      const geoData = await response.json();

      if (geoData.result?.addressMatches?.[0]) {
        const match = geoData.result.addressMatches[0];
        const { x: lng, y: lat } = match.coordinates;
        await lookupCensusTract(lat, lng);
      } else {
        setLookupError('Could not geocode this address. Please verify the address or enter tract manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLookupError('Failed to geocode address. Please enter census tract manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Address Autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Address <span className="text-red-400">*</span>
        </label>
        <AddressAutocomplete
          value={data.address}
          onChange={handleAddressSelect}
          placeholder="Start typing an address..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Select from dropdown to auto-fill city, state, ZIP and lookup census tract
        </p>
      </div>

      {/* City, State, ZIP - Auto-filled but editable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Chicago"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            State <span className="text-red-400">*</span>
          </label>
          <select
            value={data.state || ''}
            onChange={(e) => updateField('state', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select state...</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            ZIP Code <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.zipCode || ''}
            onChange={(e) => updateField('zipCode', e.target.value)}
            placeholder="60601"
            maxLength={10}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Census Tract Section */}
      <div className="border-t border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Census Tract</h3>
            <p className="text-xs text-gray-500">Auto-detected from address or enter manually</p>
          </div>
          <button
            onClick={handleManualLookup}
            disabled={isLookingUp}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 border border-gray-700"
          >
            {isLookingUp ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Looking up...
              </span>
            ) : '🔍 Re-lookup Tract'}
          </button>
        </div>

        {/* Error Message */}
        {lookupError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-300">
            {lookupError}
          </div>
        )}

        {/* Eligibility Result */}
        {eligibilityResult && (
          <div className={`mb-4 p-4 rounded-lg border ${
            eligibilityResult.eligible 
              ? 'bg-green-900/30 border-green-500/50' 
              : 'bg-yellow-900/30 border-yellow-500/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg ${eligibilityResult.eligible ? '✅' : '⚠️'}`}>
                {eligibilityResult.eligible ? '✅' : '⚠️'}
              </span>
              <span className={`font-medium ${eligibilityResult.eligible ? 'text-green-400' : 'text-yellow-400'}`}>
                {eligibilityResult.eligible ? 'NMTC Eligible Location' : 'Eligibility Not Confirmed'}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{eligibilityResult.reason}</p>
            {eligibilityResult.povertyRate && (
              <div className="flex gap-4 text-xs text-gray-400">
                <span>Poverty Rate: <strong className="text-gray-200">{eligibilityResult.povertyRate}%</strong></span>
                <span>Median Income: <strong className="text-gray-200">{eligibilityResult.medianIncomePct}% AMI</strong></span>
              </div>
            )}
            {eligibilityResult.note && (
              <p className="text-xs text-gray-500 mt-2">{eligibilityResult.note}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Census Tract Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={data.censusTract || ''}
              onChange={(e) => updateField('censusTract', e.target.value)}
              placeholder="e.g., 17031839100"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">11-digit FIPS code (State + County + Tract)</p>
          </div>
        </div>
      </div>

      {/* Tract Qualifications */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-100 mb-3">Tract Qualifications</h3>
        <p className="text-xs text-gray-500 mb-4">
          {eligibilityResult?.eligible 
            ? 'Auto-detected qualifications shown below. Adjust if needed.'
            : 'Select all that apply. This affects eligibility and pricing.'}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRACT_TYPES.map((type) => {
            const isSelected = (data.tractType || []).includes(type.id as any);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleTractType(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-900/30' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-500'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className={`font-medium ${isSelected ? 'text-indigo-300' : 'text-gray-200'}`}>
                    {type.id}
                  </span>
                  <span className="text-gray-400 text-sm">- {type.label}</span>
                </div>
                <p className="text-xs text-gray-500 ml-7">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Preview */}
      {data.censusTract && (
        <div className="border-t border-gray-800 pt-6">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-2">🗺️</div>
            <p className="text-sm text-gray-400">Map preview for tract {data.censusTract}</p>
            <button className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
              View on Full Map →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationTract;
