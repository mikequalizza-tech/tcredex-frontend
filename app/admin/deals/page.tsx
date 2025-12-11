'use client';

import { useState } from 'react';
import DealCard, { Deal } from '@/components/DealCard';

// Sample deals
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

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

type DealStatus = 'all' | 'active' | 'pending' | 'closed';

export default function AdminDealsPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [statusFilter, setStatusFilter] = useState<DealStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = allDeals.filter((deal) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      deal.projectName.toLowerCase().includes(query) ||
      deal.id.toLowerCase().includes(query) ||
      deal.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Deal Management</h1>
                <p className="text-sm text-gray-400">Admin panel for managing all deals</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                + New Deal
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'closed'] as DealStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Deal ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Project Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Project Cost</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredDeals.map((deal) => (
                <tr 
                  key={deal.id} 
                  className={`hover:bg-gray-900/50 cursor-pointer ${selectedDeal?.id === deal.id ? 'bg-gray-900' : ''}`}
                  onClick={() => setSelectedDeal(deal)}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">{deal.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-100">{deal.projectName}</div>
                    <div className="text-xs text-gray-500">{deal.parent}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{deal.location}</td>
                  <td className="px-6 py-4 text-sm text-indigo-400 font-medium">{formatCurrency(deal.projectCost)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      deal.shovelReady 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {deal.shovelReady ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                      <button className="text-xs text-gray-400 hover:text-gray-300">Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Panel */}
      {selectedDeal && (
        <div className="w-[400px] border-l border-gray-800 bg-gray-900 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Deal Preview</h2>
            <button 
              onClick={() => setSelectedDeal(null)}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <DealCard deal={selectedDeal} />
          <div className="mt-4 space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              Edit Deal
            </button>
            <button className="w-full px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
