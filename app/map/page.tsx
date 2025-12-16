'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DealCard from '@/components/DealCard';
import MapFilterRail, { FilterState, defaultFilters } from '@/components/maps/MapFilterRail';
import { mockDeals } from '@/lib/mockData';
import { useCurrentUser } from '@/lib/auth';
import type { MapDeal } from '@/components/maps/InteractiveMapPlatform';

// Dynamic import to avoid SSR issues with Mapbox
const InteractiveMapPlatform = dynamic(
  () => import('@/components/maps/InteractiveMapPlatform'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }
);

type ViewMode = 'sponsor' | 'cde' | 'investor';

// Known coordinates for demo deals
const DEAL_COORDINATES: Record<string, [number, number]> = {
  'D12345': [-89.6501, 39.7817], // Springfield, IL
  'D12346': [-83.0458, 42.3314], // Detroit, MI
  'D12347': [-76.6122, 39.2904], // Baltimore, MD
  'D12348': [-81.6944, 41.4993], // Cleveland, OH
  'D12349': [-90.0490, 35.1495], // Memphis, TN
  'D12350': [-90.1994, 38.6270], // St. Louis, MO
};

export default function MapPlatformPage() {
  // Hydration fix - track if we're mounted on client FIRST
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on client - BEFORE any other effects
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return loading state until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Deal Map...</p>
        </div>
      </div>
    );
  }

  // Only render the actual content after client-side mount
  return <MapContent />;
}

// Separate component for actual content - only rendered client-side
function MapContent() {
  const { isAuthenticated, orgType, isLoading } = useCurrentUser();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('sponsor');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<[number, number] | null>(null);
  
  // Panel visibility states - both slide in/out
  const [showFilterRail, setShowFilterRail] = useState(true);
  const [showDealPanel, setShowDealPanel] = useState(true);
  
  const dealListRef = useRef<HTMLDivElement>(null);
  const dealCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Set initial view mode based on org type
  useEffect(() => {
    if (orgType === 'cde') setViewMode('cde');
    else if (orgType === 'investor') setViewMode('investor');
    else setViewMode('sponsor');
  }, [orgType]);

  // Convert mockDeals to MapDeal format with coordinates
  const mapDeals: MapDeal[] = mockDeals.map(deal => ({
    ...deal,
    coordinates: DEAL_COORDINATES[deal.id] || undefined,
  }));

  // Filter deals based on filter state
  const filteredDeals = mapDeals.filter(deal => {
    // Shovel ready filter
    if (filters.shovelReadyOnly && !deal.shovelReady) return false;

    // Cost range filter
    if (deal.projectCost < filters.minProjectCost || deal.projectCost > filters.maxProjectCost) return false;

    return true;
  });

  // Handle tract found from address search
  const handleTractFound = useCallback((tract: unknown, coordinates: [number, number]) => {
    setSearchedLocation(coordinates);
  }, []);

  // Scroll to selected deal card
  useEffect(() => {
    if (selectedDealId && dealCardRefs.current.has(selectedDealId)) {
      const cardElement = dealCardRefs.current.get(selectedDealId);
      cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedDealId]);

  const handleSelectDeal = (dealId: string | null) => {
    setSelectedDealId(dealId);
  };

  const handleRequestMemo = (dealId: string) => {
    console.log('Requesting memo for:', dealId);
  };

  // Stats
  const totalProjectValue = filteredDeals.reduce((sum, d) => sum + d.projectCost, 0);
  const shovelReadyCount = filteredDeals.filter(d => d.shovelReady).length;

  // Show auth-dependent UI only after auth loaded
  const showAuthUI = !isLoading && isAuthenticated;

  return (
    <div className="h-screen w-screen bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Top Navigation Bar - Only for authenticated users */}
      {showAuthUI && (
        <div className="flex-none h-12 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-gray-700" />
            <Link href="/" className="flex items-center gap-2">
              <img src="/brand/tcredex_256x64.png" alt="tCredex" className="h-6 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/deals/new" 
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              + New Deal
            </Link>
            <Link 
              href="/deals" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Filter Rail - Slides in/out */}
        <div 
          className={`absolute left-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${
            showFilterRail ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <MapFilterRail
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onFiltersChange={setFilters}
            onTractFound={handleTractFound}
            autoMatchEnabled={autoMatchEnabled}
            onAutoMatchToggle={setAutoMatchEnabled}
            onClose={() => setShowFilterRail(false)}
          />
        </div>

        {/* Center: Map - Full width, panels overlay */}
        <div className="flex-1 h-full relative">
          <InteractiveMapPlatform
            deals={filteredDeals}
            selectedDealId={selectedDealId}
            onSelectDeal={handleSelectDeal}
            centerLocation={searchedLocation}
          />
          
          {/* Map Overlay Controls - Top Left */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {/* Toggle Filter Rail */}
            {!showFilterRail && (
              <button
                onClick={() => setShowFilterRail(true)}
                className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
                title="Show Filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            )}
          </div>

          {/* Map Overlay Controls - Top Right */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setShowDealPanel(!showDealPanel)}
              className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {showDealPanel ? 'Hide Deals' : 'Show Deals'}
            </button>
          </div>

          {/* Stats Bar at bottom of map */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none z-10">
            <div className="flex gap-6 px-6 py-3 bg-gray-900/90 border border-gray-700 rounded-xl pointer-events-auto">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{filteredDeals.length}</p>
                <p className="text-xs text-gray-500">Deals</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">${(totalProjectValue / 1000000).toFixed(0)}M</p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{shovelReadyCount}</p>
                <p className="text-xs text-gray-500">Shovel Ready</p>
              </div>
              {autoMatchEnabled && (
                <>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <p className="text-xs text-indigo-400">AutoMatch Active</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Deal Panel - Slides in/out */}
        <div 
          className={`absolute right-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${
            showDealPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="w-80 h-full flex flex-col bg-gray-950 border-l border-gray-800">
            {/* Panel Header */}
            <div className="flex-none px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">
                {viewMode === 'cde' ? 'Matching Deals' : viewMode === 'investor' ? 'Investment Opportunities' : 'Active Deals'}
                <span className="ml-2 text-xs font-normal text-gray-500">({filteredDeals.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                {selectedDealId && (
                  <button
                    onClick={() => setSelectedDealId(null)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowDealPanel(false)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title="Close panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View-specific banner */}
            {viewMode === 'cde' && autoMatchEnabled && (
              <div className="flex-none p-3 border-b border-gray-800 bg-indigo-950/30">
                <p className="text-xs text-indigo-300">
                  <span className="font-semibold">AutoMatch AI:</span> Deals ranked by geographic and impact alignment
                </p>
              </div>
            )}

            {viewMode === 'investor' && (
              <div className="flex-none p-3 border-b border-gray-800 bg-purple-950/30">
                <p className="text-xs text-purple-300">
                  <span className="font-semibold">Investor View:</span> CRA-eligible deals with projected returns
                </p>
              </div>
            )}

            {/* Deal Cards */}
            <div ref={dealListRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredDeals.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No deals match your filters</p>
                  <button 
                    onClick={() => setFilters(defaultFilters)}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    ref={(el) => {
                      if (el) dealCardRefs.current.set(deal.id, el);
                    }}
                    onClick={() => handleSelectDeal(deal.id)}
                    className={`cursor-pointer transition-all duration-200 rounded-xl ${
                      selectedDealId === deal.id
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950'
                        : 'hover:ring-1 hover:ring-gray-700'
                    }`}
                  >
                    <DealCard
                      deal={deal}
                      onRequestMemo={handleRequestMemo}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
