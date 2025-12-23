'use client';

import { CDEDealCard, IMPACT_PRIORITY_LABELS } from '@/lib/types/cde';
import Link from 'next/link';

interface CDECardProps {
  cde: CDEDealCard;
  onRequestMatch?: (cdeId: string) => void;
  compact?: boolean;
}

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-900/50 text-green-400 border-green-700';
    case 'fully-deployed':
      return 'bg-gray-800 text-gray-400 border-gray-700';
    case 'pending-allocation':
      return 'bg-amber-900/50 text-amber-400 border-amber-700';
    default:
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

export default function CDECard({ cde, onRequestMatch, compact = false }: CDECardProps) {
  const hasMatchScore = cde.matchScore !== undefined;
  
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all ${
      hasMatchScore && cde.matchScore! >= 80 ? 'ring-2 ring-green-500/30' : ''
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* CDE Icon */}
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-100 truncate">{cde.organizationName}</h3>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(cde.status)}`}>
                {cde.status === 'active' ? '● Active' : cde.status === 'fully-deployed' ? 'Fully Deployed' : 'Pending'}
              </span>
              {cde.smallDealFund && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-700 rounded">
                  Small Deal Fund
                </span>
              )}
            </div>
          </div>
          
          {/* Match Score */}
          {hasMatchScore && (
            <div className={`text-center px-3 py-1.5 rounded-lg ${
              cde.matchScore! >= 80 ? 'bg-green-900/50 border border-green-700' :
              cde.matchScore! >= 60 ? 'bg-amber-900/50 border border-amber-700' :
              'bg-gray-800 border border-gray-700'
            }`}>
              <p className={`text-lg font-bold ${
                cde.matchScore! >= 80 ? 'text-green-400' :
                cde.matchScore! >= 60 ? 'text-amber-400' :
                'text-gray-400'
              }`}>
                {cde.matchScore}%
              </p>
              <p className="text-xs text-gray-500">Match</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mission Snippet */}
      {!compact && cde.missionSnippet && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
          <p className="text-sm text-gray-400 line-clamp-2">{cde.missionSnippet}</p>
        </div>
      )}
      
      {/* Key Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Remaining Allocation</p>
          <p className="text-lg font-bold text-green-400">{formatCurrency(cde.remainingAllocation)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Deal Size Range</p>
          <p className="text-sm font-medium text-gray-200">
            {formatCurrency(cde.dealSizeRange.min)} - {formatCurrency(cde.dealSizeRange.max)}
          </p>
        </div>
      </div>
      
      {/* Geographic Focus */}
      {cde.primaryStates.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Service Area</p>
          <div className="flex flex-wrap gap-1">
            {cde.primaryStates.slice(0, 5).map((state) => (
              <span key={state} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">
                {state}
              </span>
            ))}
            {cde.primaryStates.length > 5 && (
              <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded">
                +{cde.primaryStates.length - 5} more
              </span>
            )}
            {cde.ruralFocus && (
              <span className="px-2 py-0.5 text-xs bg-amber-900/50 text-amber-400 rounded">Rural</span>
            )}
            {cde.urbanFocus && (
              <span className="px-2 py-0.5 text-xs bg-indigo-900/50 text-indigo-400 rounded">Urban</span>
            )}
          </div>
        </div>
      )}
      
      {/* Impact Priorities */}
      {!compact && cde.impactPriorities.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Impact Focus</p>
          <div className="flex flex-wrap gap-1">
            {cde.impactPriorities.slice(0, 4).map((priority) => (
              <span key={priority} className="px-2 py-0.5 text-xs bg-purple-900/30 text-purple-300 border border-purple-800/50 rounded">
                {IMPACT_PRIORITY_LABELS[priority]}
              </span>
            ))}
            {cde.impactPriorities.length > 4 && (
              <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded">
                +{cde.impactPriorities.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Target Sectors */}
      {!compact && cde.targetSectors.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Target Sectors</p>
          <div className="flex flex-wrap gap-1">
            {cde.targetSectors.slice(0, 3).map((sector) => (
              <span key={sector} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">
                {sector}
              </span>
            ))}
            {cde.targetSectors.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded">
                +{cde.targetSectors.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Match Reasons (if available) */}
      {hasMatchScore && cde.matchReasons && cde.matchReasons.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 mb-2">Why This Match</p>
          <ul className="space-y-1">
            {cde.matchReasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-green-400 mt-0.5">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Quick Tags */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          {cde.htcExperience && (
            <span className="px-2 py-0.5 text-xs bg-amber-900/30 text-amber-400 rounded">HTC Exp</span>
          )}
          {cde.requireSeverelyDistressed && (
            <span className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400 rounded">Severely Distressed Req</span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex gap-2">
        <Link
          href={`/cde/${cde.id}`}
          className="flex-1 px-4 py-2 text-sm font-medium text-center text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          View Profile
        </Link>
        {cde.status === 'active' && onRequestMatch && (
          <button
            onClick={() => onRequestMatch(cde.id)}
            className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Submit Project
          </button>
        )}
      </div>
      
      {/* Deadline Warning */}
      {cde.allocationDeadline && (
        <div className="px-4 py-2 bg-amber-900/20 border-t border-amber-800/30">
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deployment deadline: {new Date(cde.allocationDeadline).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
