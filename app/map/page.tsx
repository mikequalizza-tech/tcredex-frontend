'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DealCard from '@/components/DealCard';
import { mockDeals } from '@/lib/mockData';
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
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('sponsor');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    shovelReady: false,
    minCost: 0,
    maxCost: 50000000,
    creditType: 'all',
  });
  
  const dealListRef = useRef<HTMLDivElement>(null);
  const dealCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Convert mockDeals to MapDeal format with coordinates
  const mapDeals: MapDeal[] = mockDeals.map(deal => ({
    ...deal,
    coordinates: DEAL_COORDINATES[deal.id] || undefined,
  }));

  // Filter deals
  const filteredDeals = mapDeals.filter(deal => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        deal.projectName.toLowerCase().includes(query) ||
        deal.location.toLowerCase().includes(query) ||
        (deal.parent && deal.parent.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Shovel ready filter
    if (filters.shovelReady && !deal.shovelReady) return false;

    // Cost range filter
    if (deal.projectCost < filters.minCost || deal.projectCost > filters.maxCost) return false;

    return true;
  });

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
    // TODO: Open memo request modal
  };

  // Stats
  const totalProjectValue = filteredDeals.reduce((sum, d) => sum + d.projectCost, 0);
  const totalFinancingGap = filteredDeals.reduce((sum, d) => sum + d.financingGap, 0);
  const shovelReadyCount = filteredDeals.filter(d => d.shovelReady).length;

  return (
    <div className="h-screen w-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-none bg-gray-900 border-b border-gray-800 px-4 py-3 z-50">
        <div className="flex items-center justify-between max-w-full">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <img src="/brand/tcredex_transparent_256x64.png" alt="tCredex" className="h-8 w-auto" />
            </a>
            <div className="h-6 w-px bg-gray-700" />
            <span className="text-sm text-gray-400">Map Platform</span>
          </div>

          {/* Center: View Toggle */}
          <div className="flex gap-2">
            {(['sponsor', 'cde', 'investor'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {mode === 'sponsor' ? 'Sponsor' : mode === 'cde' ? 'CDE' : 'Investor'}
              </button>
            ))}
          </div>

          {/* Right: Stats + Auth */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                <span className="text-green-400">●</span> {filteredDeals.length} deals
              </span>
              <span className="text-gray-400">
                ${(totalProjectValue / 1000000).toFixed(0)}M total
              </span>
            </div>
            <a href="/signin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign In
            </a>
            <a href="/signup" className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section - Left 2/3 */}
        <div className="w-2/3 h-full relative">
          <InteractiveMapPlatform
            deals={filteredDeals}
            selectedDealId={selectedDealId}
            onSelectDeal={handleSelectDeal}
            showTractLayers={true}
            showDealPins={true}
            showLegend={true}
          />
        </div>

        {/* Deal Panel - Right 1/3 */}
        <div className="w-1/3 h-full flex flex-col bg-gray-950 border-l border-gray-800">
          {/* Search */}
          <div className="flex-none p-4 border-b border-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects, locations, sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex-none p-4 border-b border-gray-800">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, shovelReady: !f.shovelReady }))}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filters.shovelReady
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✓ Shovel Ready ({shovelReadyCount})
              </button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                NMTC
              </button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                HTC
              </button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                LIHTC
              </button>
            </div>
          </div>

          {/* View-specific panel */}
          {viewMode === 'cde' && (
            <div className="flex-none p-4 border-b border-gray-800 bg-indigo-950/30">
              <p className="text-xs font-semibold text-indigo-400 mb-2">AutoMatch AI Active</p>
              <p className="text-xs text-gray-400">
                Showing deals ranked by geographic and impact alignment with your allocation preferences.
              </p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs bg-indigo-900/50 text-indigo-300 rounded">3-Deal Rule</span>
                <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">Impact Scoring</span>
              </div>
            </div>
          )}

          {viewMode === 'investor' && (
            <div className="flex-none p-4 border-b border-gray-800 bg-purple-950/30">
              <p className="text-xs font-semibold text-purple-400 mb-2">Investor View</p>
              <p className="text-xs text-gray-400">
                Browse deals with CRA eligibility and expected returns. Contact CDEs for allocation terms.
              </p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs bg-purple-900/50 text-purple-300 rounded">CRA Eligible</span>
                <span className="px-2 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded">High Impact</span>
              </div>
            </div>
          )}

          {/* Deal List Header */}
          <div className="flex-none px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">
              Active Deals
              <span className="ml-2 text-xs font-normal text-gray-500">({filteredDeals.length})</span>
            </h2>
            {selectedDealId && (
              <button
                onClick={() => setSelectedDealId(null)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Deal Cards */}
          <div ref={dealListRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">No deals match your filters</p>
                <button 
                  onClick={() => {
                    setFilters({ shovelReady: false, minCost: 0, maxCost: 50000000, creditType: 'all' });
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Clear all filters
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

          {/* Bottom Stats Bar */}
          <div className="flex-none p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{filteredDeals.length}</p>
                <p className="text-xs text-gray-500">Deals</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-400">${(totalProjectValue / 1000000).toFixed(0)}M</p>
                <p className="text-xs text-gray-500">Total Value</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-400">${(totalFinancingGap / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500">Financing Gap</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
