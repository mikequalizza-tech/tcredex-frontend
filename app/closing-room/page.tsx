'use client';

import { useState } from 'react';
import Link from 'next/link';

type DealStatus = 'in_progress' | 'pending_docs' | 'ready_to_close' | 'closed';
type ProgramType = 'nmtc' | 'htc' | 'lihtc' | 'oz';

interface ClosingDeal {
  id: string;
  projectName: string;
  sponsor: string;
  programType: ProgramType;
  allocation: number;
  creditPrice: number;
  status: DealStatus;
  progress: number;
  estimatedClose: Date;
  lastActivity: Date;
  participants: number;
  pendingDocs: number;
}

const statusConfig: Record<DealStatus, { label: string; color: string; bg: string }> = {
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-900/50' },
  pending_docs: { label: 'Pending Docs', color: 'text-amber-400', bg: 'bg-amber-900/50' },
  ready_to_close: { label: 'Ready to Close', color: 'text-green-400', bg: 'bg-green-900/50' },
  closed: { label: 'Closed', color: 'text-gray-400', bg: 'bg-gray-700' },
};

const programColors: Record<ProgramType, string> = {
  nmtc: 'text-purple-400',
  htc: 'text-amber-400',
  lihtc: 'text-green-400',
  oz: 'text-blue-400',
};

// Demo data
const demoDeals: ClosingDeal[] = [
  {
    id: 'deal-001',
    projectName: 'Riverside Community Center',
    sponsor: 'Community Development Corp',
    programType: 'nmtc',
    allocation: 10_000_000,
    creditPrice: 0.92,
    status: 'in_progress',
    progress: 65,
    estimatedClose: new Date('2024-12-20'),
    lastActivity: new Date('2024-11-18'),
    participants: 4,
    pendingDocs: 3,
  },
  {
    id: 'deal-002',
    projectName: 'Downtown Historic Renovation',
    sponsor: 'Heritage Preservation LLC',
    programType: 'htc',
    allocation: 8_500_000,
    creditPrice: 0.88,
    status: 'pending_docs',
    progress: 45,
    estimatedClose: new Date('2025-01-15'),
    lastActivity: new Date('2024-11-15'),
    participants: 5,
    pendingDocs: 8,
  },
  {
    id: 'deal-003',
    projectName: 'Affordable Housing Phase II',
    sponsor: 'Urban Housing Partners',
    programType: 'lihtc',
    allocation: 15_000_000,
    creditPrice: 0.95,
    status: 'ready_to_close',
    progress: 95,
    estimatedClose: new Date('2024-12-01'),
    lastActivity: new Date('2024-11-20'),
    participants: 6,
    pendingDocs: 0,
  },
  {
    id: 'deal-004',
    projectName: 'Tech Innovation Hub',
    sponsor: 'Metro Economic Development',
    programType: 'oz',
    allocation: 12_000_000,
    creditPrice: 0.90,
    status: 'in_progress',
    progress: 30,
    estimatedClose: new Date('2025-03-01'),
    lastActivity: new Date('2024-11-10'),
    participants: 3,
    pendingDocs: 12,
  },
];

export default function ClosingRoomIndexPage() {
  const [filter, setFilter] = useState<DealStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = demoDeals.filter(deal => {
    const matchesFilter = filter === 'all' || deal.status === filter;
    const matchesSearch = deal.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.sponsor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: demoDeals.length,
    inProgress: demoDeals.filter(d => d.status === 'in_progress').length,
    pendingDocs: demoDeals.filter(d => d.status === 'pending_docs').length,
    readyToClose: demoDeals.filter(d => d.status === 'ready_to_close').length,
    totalAllocation: demoDeals.reduce((sum, d) => sum + d.allocation, 0),
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Closing Room</h1>
            <p className="text-gray-400 mt-1">Manage all deals in the closing pipeline</p>
          </div>
          <Link 
            href="/deals/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            + New Deal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Total Deals</p>
            <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Pending Docs</p>
            <p className="text-2xl font-bold text-amber-400">{stats.pendingDocs}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Ready to Close</p>
            <p className="text-2xl font-bold text-green-400">{stats.readyToClose}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Total Pipeline</p>
            <p className="text-2xl font-bold text-indigo-400">${(stats.totalAllocation / 1_000_000).toFixed(1)}M</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'in_progress', 'pending_docs', 'ready_to_close'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/closing-room/${deal.id}`}
              className="block bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Deal Info */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">{deal.projectName}</h3>
                      <span className={`text-sm font-medium ${programColors[deal.programType]}`}>
                        {deal.programType.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[deal.status].bg} ${statusConfig[deal.status].color}`}>
                        {statusConfig[deal.status].label}
                      </span>
                    </div>
                    <p className="text-gray-400">{deal.sponsor}</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-sm text-gray-500">Allocation</p>
                      <p className="text-lg font-semibold text-gray-100">${(deal.allocation / 1_000_000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Credit Price</p>
                      <p className="text-lg font-semibold text-green-400">${deal.creditPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Est. Close</p>
                      <p className="text-lg font-semibold text-gray-100">{deal.estimatedClose.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-400">{deal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        deal.progress >= 90 ? 'bg-green-500' :
                        deal.progress >= 50 ? 'bg-indigo-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${deal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>👥 {deal.participants} participants</span>
                  {deal.pendingDocs > 0 && (
                    <span className="text-amber-400">📄 {deal.pendingDocs} pending documents</span>
                  )}
                  <span>Last activity: {deal.lastActivity.toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-2">No deals found</p>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search' : 'Add deals from the marketplace to start closing'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
