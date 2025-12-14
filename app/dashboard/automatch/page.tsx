'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MatchResult {
  dealId: string;
  projectName: string;
  sponsor: string;
  location: string;
  matchScore: number;
  matchTier: 'Excellent' | 'Good' | 'Fair';
  nmtcRequested: number;
  rationale: string[];
  povertyRate: number;
  distressIndicator: string;
}

const demoMatches: MatchResult[] = [
  {
    dealId: 'D12345',
    projectName: 'Eastside Grocery Co-Op',
    sponsor: 'Local Roots Foundation',
    location: 'Springfield, IL',
    matchScore: 92,
    matchTier: 'Excellent',
    nmtcRequested: 5000000,
    rationale: [
      'Geographic match: IL focus state',
      'Severely distressed tract (+25 pts)',
      'NMTC eligible (+25 pts)',
      'High impact score: 82 (+20 pts)',
      'Shovel ready status (+10 pts)',
    ],
    povertyRate: 32,
    distressIndicator: 'Severe',
  },
  {
    dealId: 'D12348',
    projectName: 'Riverfront Manufacturing Hub',
    sponsor: 'Great Lakes Economic Corp',
    location: 'Cleveland, OH',
    matchScore: 85,
    matchTier: 'Excellent',
    nmtcRequested: 12000000,
    rationale: [
      'Geographic match: OH adjacent state',
      'Severely distressed tract (+25 pts)',
      'NMTC + State NMTC (+25 pts)',
      'Manufacturing sector priority (+15 pts)',
    ],
    povertyRate: 41,
    distressIndicator: 'Severe',
  },
  {
    dealId: 'D12349',
    projectName: 'Downtown Child Care Center',
    sponsor: 'Memphis Family Services',
    location: 'Memphis, TN',
    matchScore: 78,
    matchTier: 'Good',
    nmtcRequested: 2000000,
    rationale: [
      'Community facility focus (+20 pts)',
      'Shovel ready status (+10 pts)',
      'Strong community impact (+15 pts)',
      'Moderate distress indicators',
    ],
    povertyRate: 35,
    distressIndicator: 'Moderate',
  },
];

export default function DashboardAutoMatchPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runAutoMatch = async () => {
    setIsRunning(true);
    setMatches([]);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setMatches(demoMatches);
    setIsRunning(false);
    setHasRun(true);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Excellent': return 'bg-green-900/50 text-green-300 border-green-500/30';
      case 'Good': return 'bg-amber-900/50 text-amber-300 border-amber-500/30';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">AutoMatch AI</h1>
        <p className="text-gray-400 mt-1">
          AI-powered matching finds the best deals aligned with your criteria. 
          <span className="text-indigo-400 ml-1">3-Deal Rule applies.</span>
        </p>
      </div>

      {/* Run AutoMatch Section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Run Matching Algorithm</h2>
            <p className="text-sm text-gray-400 mt-1">
              Analyzes your criteria against all available deals and returns your top 3 matches.
            </p>
          </div>
          <button
            onClick={runAutoMatch}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              isRunning 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Run AutoMatch
              </>
            )}
          </button>
        </div>

        {/* Criteria Summary */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-sm text-gray-500 mb-3">Your Current Criteria</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">IL, MO, OH</span>
            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">Healthcare</span>
            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">Manufacturing</span>
            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">Mixed-Use</span>
            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">$25M Allocation</span>
          </div>
          <Link href="/dashboard/settings" className="text-sm text-indigo-400 hover:text-indigo-300 mt-3 inline-block">
            Edit criteria →
          </Link>
        </div>
      </div>

      {/* Results */}
      {hasRun && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">
              Top 3 Matches
              <span className="ml-2 text-sm font-normal text-gray-400">(3-Deal Rule)</span>
            </h2>
            <p className="text-sm text-gray-400">
              Showing best matches from 127 available deals
            </p>
          </div>
        </div>
      )}

      {/* Match Cards */}
      {matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div
              key={match.dealId}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                    index === 0 ? 'bg-yellow-600 text-yellow-100' :
                    index === 1 ? 'bg-gray-500 text-gray-100' :
                    'bg-amber-700 text-amber-100'
                  }`}>
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-100">{match.projectName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(match.matchTier)}`}>
                        {match.matchTier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{match.sponsor}</p>
                    <p className="text-sm text-gray-500">{match.location}</p>
                  </div>
                </div>

                {/* Match Score */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Match Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(match.matchScore)}`}>
                    {match.matchScore}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Match Rationale</p>
                  <ul className="space-y-1">
                    {match.rationale.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-green-400">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">NMTC Requested</span>
                    <span className="text-sm font-medium text-indigo-400">{formatCurrency(match.nmtcRequested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Poverty Rate</span>
                    <span className="text-sm font-medium text-gray-300">{match.povertyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Distress Level</span>
                    <span className={`text-sm font-medium ${
                      match.distressIndicator === 'Severe' ? 'text-orange-400' : 'text-amber-400'
                    }`}>{match.distressIndicator}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-end gap-3">
                <Link
                  href={`/deals/${match.dealId}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  View Details
                </Link>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors">
                  Request Term Sheet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasRun && (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Ready to Find Matches</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Click &quot;Run AutoMatch&quot; to analyze available deals against your criteria and receive your top 3 matches.
          </p>
        </div>
      )}
    </div>
  );
}
