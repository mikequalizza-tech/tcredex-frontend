'use client';

import { useState, useCallback } from 'react';
import DealMap from '@/components/maps/DealMap';
import AddressAutocomplete from '@/components/forms/AddressAutocomplete';

interface MapSectionProps {
  title?: string;
  description?: string;
  showLegend?: boolean;
  showSearch?: boolean;
}

export default function MapSection({ 
  title = "Free Census Tract Check",
  description = "Search any U.S. address to determine NMTC, LIHTC, and HTC eligibility instantly. No login required.",
  showLegend = true,
  showSearch = true,
}: MapSectionProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  // Dynamic map center - starts at US center, pans to searched location
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number; name?: string }>({
    latitude: 38.627,
    longitude: -90.1994,
  });
  const [mapZoom, setMapZoom] = useState(11);
  
  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    tract: string;
    programs: string[];
    povertyRate?: number | null;
    medianIncomePct?: number | null;
    reason?: string;
    note?: string;
  } | null>(null);

  // Demo markers for St. Louis area
  const dealMarkers = [
    { latitude: 38.637, longitude: -90.1894, name: 'NMTC Project A' },
    { latitude: 38.617, longitude: -90.2094, name: 'LIHTC Development' },
    { latitude: 38.647, longitude: -90.1794, name: 'HTC Rehabilitation' },
    { latitude: 38.657, longitude: -90.1694, name: 'OZ Investment' },
  ];

  const handleAddressSelect = useCallback(async (suggestion: any) => {
    if (suggestion?.center) {
      const [lng, lat] = suggestion.center;
      // Pan map to selected location
      setMapCenter({ latitude: lat, longitude: lng, name: suggestion.place_name });
      setMapZoom(14);
    }
  }, []);

  const handleCensusTractFound = async (tract: string | null) => {
    if (!tract) {
      setEligibilityResult(null);
      return;
    }

    setIsLookingUp(true);

    try {
      // Call real eligibility API
      const response = await fetch(`/api/eligibility?tract=${tract}`);
      const data = await response.json();

      setEligibilityResult({
        eligible: data.eligible,
        tract: data.tract,
        programs: data.programs || [],
        povertyRate: data.povertyRate,
        medianIncomePct: data.medianIncomePct,
        reason: data.reason,
        note: data.note,
      });
    } catch (error) {
      console.error('Eligibility check error:', error);
      setEligibilityResult({
        eligible: false,
        tract,
        programs: [],
        reason: 'Error checking eligibility',
        note: 'Please try again or verify at cdfifund.gov'
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Map Intelligence
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              {title}
            </h2>
            <p className="text-lg text-indigo-200/65">{description}</p>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="max-w-2xl mx-auto mb-8">
              <AddressAutocomplete
                value={searchAddress}
                onChange={setSearchAddress}
                onSelect={handleAddressSelect}
                onCensusTractFound={handleCensusTractFound}
                placeholder="Start typing an address (e.g., 123 Main St, St. Louis, MO)"
                label="Check Address Eligibility"
              />

              {/* Loading state */}
              {isLookingUp && (
                <div className="mt-4 p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Checking NMTC eligibility...</span>
                  </div>
                </div>
              )}

              {/* Eligibility result */}
              {eligibilityResult && !isLookingUp && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  eligibilityResult.eligible 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-red-900/30 border-red-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-3xl ${eligibilityResult.eligible ? 'text-green-400' : 'text-red-400'}`}>
                      {eligibilityResult.eligible ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className={`font-semibold text-lg ${eligibilityResult.eligible ? 'text-green-300' : 'text-red-300'}`}>
                        {eligibilityResult.eligible ? 'Eligible for Tax Credits!' : 'Not in Qualified Tract'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Census Tract: <span className="font-mono text-gray-300">{eligibilityResult.tract}</span>
                      </p>
                      
                      {eligibilityResult.reason && (
                        <p className="text-sm text-gray-400 mt-1">{eligibilityResult.reason}</p>
                      )}
                      
                      {eligibilityResult.eligible && eligibilityResult.programs.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {eligibilityResult.programs.map((program) => (
                            <span
                              key={program}
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                program === 'NMTC' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                                program === 'Opportunity Zone' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' :
                                program === 'Severely Distressed' ? 'bg-orange-900/50 text-orange-300 border border-orange-500/30' :
                                'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {program}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {eligibilityResult.povertyRate !== null && eligibilityResult.povertyRate !== undefined && (
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                          <div>
                            <p className="text-xs text-gray-500">Poverty Rate</p>
                            <p className="text-lg font-semibold text-gray-200">{eligibilityResult.povertyRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Median Income</p>
                            <p className="text-lg font-semibold text-gray-200">
                              {eligibilityResult.medianIncomePct ? `${eligibilityResult.medianIncomePct.toFixed(0)}% AMI` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {eligibilityResult.note && (
                        <p className="text-xs text-gray-500 mt-3 italic">{eligibilityResult.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map */}
          <div data-aos="fade-up">
            <DealMap
              center={mapCenter}
              markers={dealMarkers}
              height="500px"
              zoom={mapZoom}
              className="border border-gray-700/50"
            />
          </div>

          {/* Map legend */}
          {showLegend && (
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span>Active Deals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>NMTC Eligible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span>HTC Eligible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span>Opportunity Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span>Severely Distressed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
