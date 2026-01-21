'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DealCard from '@/components/DealCard';
import { Deal } from '@/lib/data/deals';
import CDECard from '@/components/CDECard';
import MapFilterRail, { FilterState, defaultFilters } from '@/components/maps/MapFilterRail';
import { fetchDeals, fetchCDEs } from '@/lib/supabase/queries';
import { calculateCDEMatchScore } from '@/lib/cde/matchScore';
import { CDEDealCard } from '@/lib/types/cde';
import { useCurrentUser } from '@/lib/auth';
import { mapDealToCard } from '@/lib/utils/dealCardMapper';
import AppLayout from '@/components/layout/AppLayout';

// Dynamic import of the map to avoid SSR issues
const HomeMapWithTracts = dynamic(
  () => import('@/components/maps/HomeMapWithTracts'),
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

// Fallback coordinates if none exist
const DEAL_COORDINATES: Record<string, [number, number]> = {
  'D12345': [-89.6501, 39.7817],
  'D12346': [-83.0458, 42.3314],
  'D12347': [-76.6122, 39.2904],
  'D12348': [-81.6944, 41.4993],
  'D12349': [-90.0490, 35.1495],
  'D12350': [-90.1994, 38.6270],
};

interface SearchedTract {
  coordinates: [number, number];
  geoid: string;
  address?: string;
}

export default function MapPlatformPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <MapContent />
    </AppLayout>
  );
}

function MapContent() {
  const { isAuthenticated, orgType, isLoading: authLoading } = useCurrentUser();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);
  const [searchedTract, setSearchedTract] = useState<SearchedTract | null>(null);
  const [showFilterRail, setShowFilterRail] = useState(true);
  const [showDealPanel, setShowDealPanel] = useState(true);
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [cdes, setCDEs] = useState<CDEDealCard[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const cardListRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // === FIX: ALL HOOKS MUST BE BEFORE ANY RETURN STATEMENT ===

  // 1. Move useCallback UP here
  const handleTractFound = useCallback((tract: { geoid: string }, coordinates: [number, number], address?: string) => {
    setSearchedTract({ coordinates, geoid: tract.geoid, address });
  }, []);

  // 2. Move useEffect (scroll) UP here
  useEffect(() => {
    if (selectedId && cardRefs.current.has(selectedId)) {
      cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedId]);

  // 3. Move useEffect (data fetch) UP here
  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const [fetchedDeals, fetchedCDEs] = await Promise.all([
          fetchDeals(),
          fetchCDEs()
        ]);
        setDeals(fetchedDeals.map(mapDealToCard));
        setCDEs(fetchedCDEs);
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  // ==========================================================

  // VIEW MODE IS LOCKED TO USER TYPE - No switcher!
  const viewMode: ViewMode = orgType === 'cde' ? 'cde' : orgType === 'investor' ? 'investor' : 'sponsor';

  // CONDITIONAL RETURN: Safe to return now because all hooks are registered above
  if (authLoading || dataLoading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DATA PREPARATION (Runs only after loading is done)
  // ============================================
  
  const mapDeals = deals.map(deal => ({
    ...deal,
    coordinates: deal.coordinates || DEAL_COORDINATES[deal.id] || undefined,
  }));

  const filteredDeals = mapDeals.filter(deal => {
    if (filters.shovelReadyOnly && !deal.shovelReady) return false;
    const cost = deal.projectCost || 0;
    if (cost < filters.minProjectCost || cost > filters.maxProjectCost) return false;
    return true;
  });

  const filteredCDEs = cdes
    .filter(cde => cde.status === 'active')
    .map(cde => {
      const { score, reasons } = autoMatchEnabled
        ? calculateCDEMatchScore(cde, {
            state: 'IL',
            projectType: 'Manufacturing',
            allocationRequest: 5000000,
            severelyDistressed: false,
          })
        : { score: undefined, reasons: [] };
      
      return {
        ...cde,
        matchScore: autoMatchEnabled ? score : undefined,
        matchReasons: autoMatchEnabled ? reasons : undefined,
      };
    })
    .sort((a, b) => {
      if (autoMatchEnabled && a.matchScore !== undefined && b.matchScore !== undefined) {
        return b.matchScore - a.matchScore;
      }
      return b.remainingAllocation - a.remainingAllocation;
    });

  const handleSelectCard = (id: string | null) => setSelectedId(id);

  const handleRequestMemo = (dealId: string) => {
    const deal = filteredDeals.find(d => d.id === dealId);
    if (deal) alert(`Allocation Memo Request Submitted!\n\nProject: ${deal.projectName}\nDeal ID: ${dealId}`);
  };

  const handleRequestCDEMatch = (cdeId: string) => {
    const cde = filteredCDEs.find(c => c.id === cdeId);
    if (cde) alert(`Project Submission Request!\n\nCDE: ${cde.organizationName}\n\nRedirecting to project submission...`);
  };

  const totalProjectValue = filteredDeals.reduce((sum, d) => sum + (d.projectCost || 0), 0);
  const totalCDEAllocation = filteredCDEs.reduce((sum, c) => sum + c.remainingAllocation, 0);
  const shovelReadyCount = filteredDeals.filter(d => d.shovelReady).length;
  const activeCDECount = filteredCDEs.length;

  const getPanelInfo = () => {
    switch (viewMode) {
      case 'sponsor': return { title: 'CDEs with Allocation', count: filteredCDEs.length, subtitle: 'Find CDEs matching your project' };
      case 'cde': return { title: 'Projects Seeking Allocation', count: filteredDeals.length, subtitle: 'Deals matching your criteria' };
      case 'investor': return { title: 'Investment Opportunities', count: filteredDeals.length, subtitle: 'Deals in closing' };
    }
  };

  const panelInfo = getPanelInfo();

  return (
    <div className="h-full w-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Filter Rail */}
        <div className={`absolute left-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${showFilterRail ? 'translate-x-0' : '-translate-x-full'}`}>
          <MapFilterRail
            viewMode={viewMode}
            filters={filters}
            onFiltersChange={setFilters}
            onTractFound={handleTractFound}
            autoMatchEnabled={autoMatchEnabled}
            onAutoMatchToggle={setAutoMatchEnabled}
            onClose={() => setShowFilterRail(false)}
          />
        </div>

        {/* Center: Map */}
        <div className="flex-1 h-full relative">
          <HomeMapWithTracts
            height="100%"
            className="w-full h-full"
            
            // LOGIC: If Sponsor, hide deals, show Allocation Money.
            // If CDE/Investor, show Deal Pins.
            deals={viewMode === 'sponsor' ? [] : mapDeals}
            allocations={viewMode === 'sponsor' ? filteredCDEs : []}
            
            searchedLocation={searchedTract ? { lat: searchedTract.coordinates[1], lng: searchedTract.coordinates[0], tract: searchedTract.geoid, address: searchedTract.address } : null}
          />
          
          {/* Map Overlay Controls - Top Left */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {!showFilterRail && (
              <button onClick={() => setShowFilterRail(true)} className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            )}
          </div>

          {/* Map Overlay Controls - Top Right */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button onClick={() => setShowDealPanel(!showDealPanel)} className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {showDealPanel ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none z-10">
            <div className="flex gap-6 px-6 py-3 bg-gray-900/90 border border-gray-700 rounded-xl pointer-events-auto">
              {viewMode === 'sponsor' ? (
                <>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-400">{activeCDECount}</p>
                    <p className="text-xs text-gray-500">Active CDEs</p>
                  </div>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-400">${(totalCDEAllocation / 1000000).toFixed(0)}M</p>
                    <p className="text-xs text-gray-500">Available Allocation</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{filteredDeals.length}</p>
                    <p className="text-xs text-gray-500">Projects</p>
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
                </>
              )}
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

        {/* Right: Card Panel */}
        <div className={`absolute right-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${showDealPanel ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="w-96 h-full flex flex-col bg-gray-950 border-l border-gray-800">
            {/* Panel Header */}
            <div className="flex-none px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">
                    {panelInfo.title}
                    <span className="ml-2 text-xs font-normal text-gray-500">({panelInfo.count})</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{panelInfo.subtitle}</p>
                </div>
                <button onClick={() => setShowDealPanel(false)} className="p-1 text-gray-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View-specific banner */}
            {viewMode === 'sponsor' && (
              <div className="flex-none p-3 border-b border-gray-800 bg-green-950/30">
                <p className="text-xs text-green-300">
                  <span className="font-semibold">Sponsor View:</span> Find CDEs with allocation that match your project
                </p>
              </div>
            )}
            {viewMode === 'cde' && autoMatchEnabled && (
              <div className="flex-none p-3 border-b border-gray-800 bg-purple-950/30">
                <p className="text-xs text-purple-300">
                  <span className="font-semibold">AutoMatch AI:</span> Deals ranked by your CDE criteria
                </p>
              </div>
            )}
            {viewMode === 'investor' && (
              <div className="flex-none p-3 border-b border-gray-800 bg-blue-950/30">
                <p className="text-xs text-blue-300">
                  <span className="font-semibold">Investor View:</span> CRA-eligible deals with projected returns
                </p>
              </div>
            )}

            {/* Card List */}
            <div ref={cardListRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {viewMode === 'sponsor' ? (
                // SPONSOR VIEW: Show CDE Cards
                filteredCDEs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500 text-sm">No CDEs match your filters</p>
                    <button onClick={() => setFilters(defaultFilters)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Reset filters</button>
                  </div>
                ) : (
                  filteredCDEs.map((cde) => (
                    <div
                      key={cde.id}
                      ref={(el) => { if (el) cardRefs.current.set(cde.id, el); }}
                      onClick={() => handleSelectCard(cde.id)}
                      className={`cursor-pointer transition-all duration-200 ${selectedId === cde.id ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-950 rounded-xl' : ''}`}
                    >
                      <CDECard cde={cde} onRequestMatch={handleRequestCDEMatch} />
                    </div>
                  ))
                )
              ) : (
                // CDE/INVESTOR VIEW: Show Deal Cards
                filteredDeals.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No projects match your filters</p>
                    <button onClick={() => setFilters(defaultFilters)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Reset filters</button>
                  </div>
                ) : (
                  filteredDeals.map((deal) => (
                    <div
                      key={deal.id}
                      ref={(el) => { if (el) cardRefs.current.set(deal.id, el); }}
                      onClick={() => handleSelectCard(deal.id)}
                      className={`cursor-pointer transition-all duration-200 rounded-xl ${selectedId === deal.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950' : 'hover:ring-1 hover:ring-gray-700'}`}
                    >
                      <DealCard deal={deal} onRequestMemo={handleRequestMemo} />
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}