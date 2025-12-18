'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';

interface MatchResult {
  id: string;
  projectName: string;
  sponsorName: string;
  city: string;
  state: string;
  allocationRequest: number;
  matchScore: number;
  tractType: string[];
  programType: 'NMTC' | 'HTC' | 'LIHTC';
  scoreBreakdown: {
    geographic: number;
    sector: number;
    dealSize: number;
    tractDesignation: number;
    timing: number;
    compliance: number;
  };
  matchReasons: string[];
  submittedDate: string;
}

const DEMO_MATCHES: MatchResult[] = [
  {
    id: 'match-1',
    projectName: 'Chicago South Side Community Center',
    sponsorName: 'Metro Development Corp',
    city: 'Chicago',
    state: 'IL',
    allocationRequest: 15000000,
    matchScore: 94,
    tractType: ['SD', 'QCT'],
    programType: 'NMTC',
    scoreBreakdown: {
      geographic: 20,
      sector: 18,
      dealSize: 16,
      tractDesignation: 20,
      timing: 10,
      compliance: 10,
    },
    matchReasons: [
      'Located in your primary service area (IL)',
      'Healthcare sector aligns with your priority',
      'Severely distressed tract meets your criteria',
      'Deal size within your preferred range',
      'Non-metro deployment opportunity',
    ],
    submittedDate: '2024-12-15',
  },
  {
    id: 'match-2',
    projectName: 'Milwaukee Workforce Training Hub',
    sponsorName: 'Badger Community Partners',
    city: 'Milwaukee',
    state: 'WI',
    allocationRequest: 8000000,
    matchScore: 87,
    tractType: ['QCT'],
    programType: 'NMTC',
    scoreBreakdown: {
      geographic: 18,
      sector: 16,
      dealSize: 18,
      tractDesignation: 15,
      timing: 10,
      compliance: 10,
    },
    matchReasons: [
      'Located in your service area (WI)',
      'Education/workforce aligns with priority sectors',
      'Deal size optimal for your remaining allocation',
      'Qualified census tract eligible',
    ],
    submittedDate: '2024-12-10',
  },
  {
    id: 'match-3',
    projectName: 'Springfield Healthcare Clinic',
    sponsorName: 'Central IL Health Corp',
    city: 'Springfield',
    state: 'IL',
    allocationRequest: 4000000,
    matchScore: 82,
    tractType: ['LIC'],
    programType: 'NMTC',
    scoreBreakdown: {
      geographic: 20,
      sector: 18,
      dealSize: 12,
      tractDesignation: 12,
      timing: 10,
      compliance: 10,
    },
    matchReasons: [
      'Located in your primary service area (IL)',
      'Healthcare sector - high priority match',
      'Non-metro location helps compliance',
      'Smaller deal size may work for remaining capacity',
    ],
    submittedDate: '2024-12-01',
  },
  {
    id: 'match-4',
    projectName: 'St. Louis Manufacturing Expansion',
    sponsorName: 'Gateway Industrial LLC',
    city: 'St. Louis',
    state: 'MO',
    allocationRequest: 12000000,
    matchScore: 79,
    tractType: ['SD'],
    programType: 'NMTC',
    scoreBreakdown: {
      geographic: 16,
      sector: 14,
      dealSize: 15,
      tractDesignation: 18,
      timing: 8,
      compliance: 8,
    },
    matchReasons: [
      'Located in your service area (MO)',
      'Manufacturing creates quality jobs',
      'Severely distressed tract designation',
      'Slightly outside optimal deal size range',
    ],
    submittedDate: '2024-11-28',
  },
  {
    id: 'match-5',
    projectName: 'Indianapolis Charter School',
    sponsorName: 'Crossroads Education Foundation',
    city: 'Indianapolis',
    state: 'IN',
    allocationRequest: 6000000,
    matchScore: 75,
    tractType: ['SD', 'QCT'],
    programType: 'NMTC',
    scoreBreakdown: {
      geographic: 14,
      sector: 16,
      dealSize: 15,
      tractDesignation: 18,
      timing: 6,
      compliance: 6,
    },
    matchReasons: [
      'Located in secondary service area (IN)',
      'Education sector alignment',
      'Excellent tract designations (SD + QCT)',
      'May require co-allocation partner',
    ],
    submittedDate: '2024-11-20',
  },
];

export default function AutoMatchPage() {
  return (
    <ProtectedRoute>
      <AutoMatchContent />
    </ProtectedRoute>
  );
}

function AutoMatchContent() {
  const { orgName } = useCurrentUser();
  const [matches] = useState<MatchResult[]>(DEMO_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [minScore, setMinScore] = useState(70);
  const [isRunning, setIsRunning] = useState(false);

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const filteredMatches = matches.filter(m => m.matchScore >= minScore);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-900/30 border-green-700/50';
    if (score >= 80) return 'bg-yellow-900/30 border-yellow-700/50';
    if (score >= 70) return 'bg-orange-900/30 border-orange-700/50';
    return 'bg-red-900/30 border-red-700/50';
  };

  const runAutoMatch = async () => {
    setIsRunning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            AutoMatch AI
          </h1>
          <p className="text-gray-400 mt-1">AI-powered project matching for {orgName || 'your CDE'}</p>
        </div>
        <button
          onClick={runAutoMatch}
          disabled={isRunning}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run AutoMatch
            </>
          )}
        </button>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How AutoMatch Works</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">1</span>
            </div>
            <p className="text-sm text-gray-300">Analyzes your investment criteria</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">2</span>
            </div>
            <p className="text-sm text-gray-300">Scans marketplace projects</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">3</span>
            </div>
            <p className="text-sm text-gray-300">Scores based on 6 dimensions</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">4</span>
            </div>
            <p className="text-sm text-gray-300">Ranks & explains matches</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Minimum Score:</span>
          <div className="flex gap-2">
            {[70, 80, 90].map(score => (
              <button
                key={score}
                onClick={() => setMinScore(score)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  minScore === score 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {score}+
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-400">
          <span className="text-white font-semibold">{filteredMatches.length}</span> matches found
        </p>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map((match, index) => (
          <div
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-6">
              {/* Rank */}
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
              </div>

              {/* Score */}
              <div className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreBg(match.matchScore)}`}>
                <div className={`text-3xl font-bold ${getScoreColor(match.matchScore)}`}>{match.matchScore}</div>
                <div className="text-xs text-gray-500">Match</div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{match.projectName}</h3>
                    <p className="text-gray-400">{match.sponsorName} • {match.city}, {match.state}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-400">{formatCurrency(match.allocationRequest)}</div>
                    <div className="text-sm text-gray-500">Allocation Request</div>
                  </div>
                </div>

                {/* Score Breakdown Mini */}
                <div className="flex gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs text-gray-400">Geo: {match.scoreBreakdown.geographic}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-gray-400">Sector: {match.scoreBreakdown.sector}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-xs text-gray-400">Size: {match.scoreBreakdown.dealSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-xs text-gray-400">Tract: {match.scoreBreakdown.tractDesignation}</span>
                  </div>
                </div>

                {/* Match Reasons Preview */}
                <div className="flex flex-wrap gap-2">
                  {match.matchReasons.slice(0, 2).map((reason, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                      {reason}
                    </span>
                  ))}
                  {match.matchReasons.length > 2 && (
                    <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                      +{match.matchReasons.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Tract Types & Action */}
              <div className="flex-shrink-0 text-right">
                <div className="flex gap-1 mb-3 justify-end">
                  {match.tractType.map(tract => (
                    <span
                      key={tract}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tract === 'SD' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {tract}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/deals/${match.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  View Project →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedMatch(null)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedMatch.projectName}</h3>
                <p className="text-gray-400">{selectedMatch.sponsorName} • {selectedMatch.city}, {selectedMatch.state}</p>
              </div>
              <button onClick={() => setSelectedMatch(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreBg(selectedMatch.matchScore)}`}>
                <div className={`text-4xl font-bold ${getScoreColor(selectedMatch.matchScore)}`}>{selectedMatch.matchScore}</div>
                <div className="text-xs text-gray-500">Match Score</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-indigo-400 mb-1">{formatCurrency(selectedMatch.allocationRequest)}</div>
                <p className="text-gray-400">Allocation Request</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Score Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Geographic Fit', value: selectedMatch.scoreBreakdown.geographic, max: 20, color: 'bg-green-500' },
                  { label: 'Sector Match', value: selectedMatch.scoreBreakdown.sector, max: 20, color: 'bg-blue-500' },
                  { label: 'Deal Size', value: selectedMatch.scoreBreakdown.dealSize, max: 20, color: 'bg-purple-500' },
                  { label: 'Tract Designation', value: selectedMatch.scoreBreakdown.tractDesignation, max: 20, color: 'bg-amber-500' },
                  { label: 'Timing', value: selectedMatch.scoreBreakdown.timing, max: 10, color: 'bg-teal-500' },
                  { label: 'Compliance Benefit', value: selectedMatch.scoreBreakdown.compliance, max: 10, color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color}`}
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Reasons */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Why This Match</h4>
              <ul className="space-y-2">
                {selectedMatch.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/deals/${selectedMatch.id}`}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-center"
              >
                View Full Project
              </Link>
              <button className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 font-medium">
                Add to Pipeline
              </button>
              <button className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
