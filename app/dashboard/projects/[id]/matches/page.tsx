'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

// Demo CDE matches
const demoMatches = [
  {
    id: 'M001',
    cdeName: 'Midwest Community Development Fund',
    status: 'interested',
    matchScore: 92,
    allocationAvailable: 8500000,
    targetGeographies: ['IL', 'MO', 'IN'],
    focusAreas: ['Healthcare', 'Community Facilities'],
    contactedAt: '2024-12-10',
  },
  {
    id: 'M002',
    cdeName: 'Urban Development Fund',
    status: 'reviewing',
    matchScore: 88,
    allocationAvailable: 12000000,
    targetGeographies: ['National'],
    focusAreas: ['Food Access', 'Healthcare', 'Manufacturing'],
    contactedAt: '2024-12-08',
  },
  {
    id: 'M003',
    cdeName: 'Community Reinvestment Partners',
    status: 'pending',
    matchScore: 85,
    allocationAvailable: 6000000,
    targetGeographies: ['IL', 'WI', 'MI'],
    focusAreas: ['Community Facilities', 'Education'],
    contactedAt: null,
  },
  {
    id: 'M004',
    cdeName: 'Capital Impact Partners',
    status: 'declined',
    matchScore: 78,
    allocationAvailable: 15000000,
    targetGeographies: ['National'],
    focusAreas: ['Healthcare', 'Education'],
    contactedAt: '2024-12-05',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending Outreach', color: 'text-gray-400', bg: 'bg-gray-800' },
  interested: { label: 'Interested', color: 'text-green-400', bg: 'bg-green-900/30' },
  reviewing: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  declined: { label: 'Declined', color: 'text-red-400', bg: 'bg-red-900/30' },
  term_sheet: { label: 'Term Sheet', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
};

export default function ProjectMatchesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/projects" className="text-gray-400 hover:text-white">
          Projects
        </Link>
        <span className="text-gray-600">/</span>
        <Link href={`/dashboard/projects/${projectId}`} className="text-gray-400 hover:text-white">
          Project Details
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Matches</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">CDE Matches</h1>
          <p className="text-gray-400">
            {demoMatches.length} CDEs matched based on your project criteria
          </p>
        </div>
        <Link
          href="/dashboard/automatch"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Run AutoMatch
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <Link 
          href={`/dashboard/projects/${projectId}`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Overview
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/documents`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Documents
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/matches`}
          className="pb-3 px-2 text-sm font-medium text-indigo-400 border-b-2 border-indigo-500"
        >
          Matches
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/timeline`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Timeline
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Matches</p>
          <p className="text-2xl font-bold text-white">{demoMatches.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Interested</p>
          <p className="text-2xl font-bold text-green-400">
            {demoMatches.filter(m => m.status === 'interested').length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Under Review</p>
          <p className="text-2xl font-bold text-amber-400">
            {demoMatches.filter(m => m.status === 'reviewing').length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Avg Match Score</p>
          <p className="text-2xl font-bold text-indigo-400">
            {Math.round(demoMatches.reduce((sum, m) => sum + m.matchScore, 0) / demoMatches.length)}%
          </p>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {demoMatches.map((match) => (
          <div
            key={match.id}
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-100">{match.cdeName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[match.status].bg} ${statusConfig[match.status].color}`}>
                    {statusConfig[match.status].label}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-6 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Match Score</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            match.matchScore >= 90 ? 'bg-green-500' :
                            match.matchScore >= 80 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${match.matchScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-200">{match.matchScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Available Allocation</p>
                    <p className="text-sm font-medium text-green-400">{formatCurrency(match.allocationAvailable)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Target Areas</p>
                    <p className="text-sm text-gray-300">{match.targetGeographies.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Focus</p>
                    <p className="text-sm text-gray-300">{match.focusAreas.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {match.status === 'pending' && (
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
                    Reach Out
                  </button>
                )}
                {match.status === 'interested' && (
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors">
                    Schedule Call
                  </button>
                )}
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                  View CDE
                </button>
              </div>
            </div>

            {match.contactedAt && (
              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-800">
                Last contacted: {match.contactedAt}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
