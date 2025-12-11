'use client';

import { useState } from 'react';
import DealCard, { Deal } from '@/components/DealCard';

// Sample deals - replace with API
const allDeals: Deal[] = [
  {
    id: 'D12345',
    projectName: 'Eastside Grocery Co-Op',
    location: 'Springfield, IL',
    parent: 'Local Roots Foundation',
    address: '1234 Market St',
    censusTract: '17031010100',
    povertyRate: 32,
    medianIncome: 28500,
    unemployment: 11.4,
    projectCost: 7200000,
    fedNmtcReq: 5000000,
    stateNmtcReq: 1500000,
    htc: 450000,
    shovelReady: true,
    completionDate: 'Dec 2025',
    financingGap: 400000,
  },
  {
    id: 'D12346',
    projectName: 'Northgate Health Center',
    location: 'Detroit, MI',
    parent: 'Community Health Partners',
    address: '500 Woodward Ave',
    censusTract: '26163520100',
    povertyRate: 38,
    medianIncome: 24200,
    unemployment: 14.2,
    projectCost: 12500000,
    fedNmtcReq: 8000000,
    stateNmtcReq: 2000000,
    shovelReady: true,
    completionDate: 'Mar 2026',
    financingGap: 750000,
  },
  {
    id: 'D12347',
    projectName: 'Heritage Arts Center',
    location: 'Baltimore, MD',
    parent: 'Baltimore Cultural Trust',
    address: '221 Pratt St',
    censusTract: '24510030100',
    povertyRate: 28,
    medianIncome: 31500,
    unemployment: 9.8,
    projectCost: 4800000,
    fedNmtcReq: 3000000,
    htc: 1200000,
    shovelReady: false,
    completionDate: 'Jun 2026',
    financingGap: 280000,
  },
  {
    id: 'D12348',
    projectName: 'Riverfront Manufacturing Hub',
    location: 'Cleveland, OH',
    parent: 'Great Lakes Economic Corp',
    address: '800 Lakeside Ave',
    censusTract: '39035108100',
    povertyRate: 41,
    medianIncome: 22100,
    unemployment: 15.6,
    projectCost: 18500000,
    fedNmtcReq: 12000000,
    stateNmtcReq: 3000000,
    shovelReady: true,
    completionDate: 'Sep 2026',
    financingGap: 1200000,
  },
  {
    id: 'D12349',
    projectName: 'Downtown Child Care Center',
    location: 'Memphis, TN',
    parent: 'Memphis Family Services',
    address: '345 Union Ave',
    censusTract: '47157003900',
    povertyRate: 35,
    medianIncome: 26800,
    unemployment: 12.1,
    projectCost: 3200000,
    fedNmtcReq: 2000000,
    shovelReady: true,
    completionDate: 'Aug 2025',
    financingGap: 180000,
  },
  {
    id: 'D12350',
    projectName: 'Historic Hotel Restoration',
    location: 'St. Louis, MO',
    parent: 'Gateway Preservation LLC',
    address: '100 Washington Ave',
    censusTract: '29510101100',
    povertyRate: 29,
    medianIncome: 29500,
    unemployment: 10.2,
    projectCost: 24000000,
    fedNmtcReq: 10000000,
    htc: 8500000,
    shovelReady: false,
    completionDate: 'Dec 2026',
    financingGap: 2100000,
  },
];

type SortOption = 'newest' | 'projectCost' | 'financingGap' | 'povertyRate';

export default function DealsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = allDeals
    .filter((deal) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        deal.projectName.toLowerCase().includes(query) ||
        deal.location.toLowerCase().includes(query) ||
        deal.parent.toLowerCase().includes(query) ||
        deal.id.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'projectCost':
          return b.projectCost - a.projectCost;
        case 'financingGap':
          return b.financingGap - a.financingGap;
        case 'povertyRate':
          return b.povertyRate - a.povertyRate;
        default:
          return 0; // newest - would sort by date in real app
      }
    });

  const handleRequestMemo = (dealId: string) => {
    console.log('Requesting memo for:', dealId);
  };

  // Stats
  const totalProjectCost = allDeals.reduce((sum, d) => sum + d.projectCost, 0);
  const totalFinancingGap = allDeals.reduce((sum, d) => sum + d.financingGap, 0);
  const shovelReadyCount = allDeals.filter((d) => d.shovelReady).length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-100">Browse Deals</h1>
          <p className="mt-2 text-gray-400">
            Explore all available tax credit investment opportunities.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Total Deals</p>
            <p className="text-2xl font-bold text-gray-100">{allDeals.length}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Total Project Cost</p>
            <p className="text-2xl font-bold text-indigo-400">${(totalProjectCost / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Financing Gap</p>
            <p className="text-2xl font-bold text-orange-400">${(totalFinancingGap / 1000000).toFixed(1)}M</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-sm text-gray-400">Shovel Ready</p>
            <p className="text-2xl font-bold text-green-400">{shovelReadyCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="projectCost">Highest Project Cost</option>
            <option value="financingGap">Largest Financing Gap</option>
            <option value="povertyRate">Highest Poverty Rate</option>
          </select>
        </div>

        {/* Results */}
        <p className="mb-4 text-sm text-gray-400">
          {filteredDeals.length} deals found
        </p>

        {/* Deal Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onRequestMemo={handleRequestMemo}
            />
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No deals found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
