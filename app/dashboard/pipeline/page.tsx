'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsor: string;
  location: string;
  censusTract: string;
  projectCost: number;
  nmtcRequested: number;
  matchScore: number;
  stage: 'new' | 'reviewing' | 'due_diligence' | 'term_sheet' | 'committed' | 'closing';
  receivedAt: string;
  povertyRate: number;
  distressIndicator: 'severe' | 'moderate' | 'standard';
}

const demoPipeline: PipelineDeal[] = [
  {
    id: 'D001',
    projectName: 'Eastside Grocery Co-Op',
    sponsor: 'Local Roots Foundation',
    location: 'Springfield, IL',
    censusTract: '17031010100',
    projectCost: 7200000,
    nmtcRequested: 5000000,
    matchScore: 92,
    stage: 'due_diligence',
    receivedAt: '2024-11-20',
    povertyRate: 32,
    distressIndicator: 'severe',
  },
  {
    id: 'D002',
    projectName: 'Northgate Health Center',
    sponsor: 'Community Health Partners',
    location: 'Detroit, MI',
    censusTract: '26163520100',
    projectCost: 12500000,
    nmtcRequested: 8000000,
    matchScore: 85,
    stage: 'term_sheet',
    receivedAt: '2024-11-15',
    povertyRate: 38,
    distressIndicator: 'severe',
  },
  {
    id: 'D003',
    projectName: 'Heritage Arts Center',
    sponsor: 'Baltimore Cultural Trust',
    location: 'Baltimore, MD',
    censusTract: '24510030100',
    projectCost: 4800000,
    nmtcRequested: 3000000,
    matchScore: 78,
    stage: 'new',
    receivedAt: '2024-12-10',
    povertyRate: 28,
    distressIndicator: 'moderate',
  },
  {
    id: 'D004',
    projectName: 'Manufacturing Hub',
    sponsor: 'Great Lakes Economic Corp',
    location: 'Cleveland, OH',
    censusTract: '39035108100',
    projectCost: 18500000,
    nmtcRequested: 12000000,
    matchScore: 95,
    stage: 'committed',
    receivedAt: '2024-10-01',
    povertyRate: 41,
    distressIndicator: 'severe',
  },
];

const stageConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-900/50 text-blue-300 border-blue-500/30' },
  reviewing: { label: 'Reviewing', color: 'bg-purple-900/50 text-purple-300 border-purple-500/30' },
  due_diligence: { label: 'Due Diligence', color: 'bg-amber-900/50 text-amber-300 border-amber-500/30' },
  term_sheet: { label: 'Term Sheet', color: 'bg-orange-900/50 text-orange-300 border-orange-500/30' },
  committed: { label: 'Committed', color: 'bg-green-900/50 text-green-300 border-green-500/30' },
  closing: { label: 'Closing', color: 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30' },
};

export default function PipelinePage() {
  const [pipeline] = useState<PipelineDeal[]>(demoPipeline);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-red-400';
  };

  // Stats
  const totalPipeline = pipeline.reduce((sum, d) => sum + d.nmtcRequested, 0);
  const newDeals = pipeline.filter(d => d.stage === 'new').length;
  const activeDeals = pipeline.filter(d => !['new', 'committed', 'closing'].includes(d.stage)).length;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Pipeline</h1>
          <p className="text-gray-400 mt-1">Manage incoming deals and track your allocation deployment.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/automatch"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Run AutoMatch
          </Link>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Pipeline</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalPipeline)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">New Deals</p>
          <p className="text-2xl font-bold text-blue-400">{newDeals}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Active Deals</p>
          <p className="text-2xl font-bold text-amber-400">{activeDeals}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Deals</p>
          <p className="text-2xl font-bold text-gray-300">{pipeline.length}</p>
        </div>
      </div>

      {/* Pipeline List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Project</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Match Score</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">NMTC Request</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Distress</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Stage</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map((deal) => (
              <tr key={deal.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-200">{deal.projectName}</p>
                    <p className="text-xs text-gray-500">{deal.sponsor} • {deal.location}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-2xl font-bold ${getMatchScoreColor(deal.matchScore)}`}>
                    {deal.matchScore}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-200 font-medium">{formatCurrency(deal.nmtcRequested)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    deal.distressIndicator === 'severe' ? 'bg-orange-900/50 text-orange-300' :
                    deal.distressIndicator === 'moderate' ? 'bg-amber-900/50 text-amber-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {deal.distressIndicator}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{deal.povertyRate}% poverty</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${stageConfig[deal.stage].color}`}>
                    {stageConfig[deal.stage].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
