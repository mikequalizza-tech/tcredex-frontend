'use client';

import React from 'react';
import { ScoringOutput } from '@/lib/scoring/engine';

interface ScoreCardProps {
  score: ScoringOutput;
  showDetails?: boolean;
}

const TIER_CONFIG = {
  1: {
    label: 'Greenlight',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700/50',
    description: 'High priority - meets all criteria'
  },
  2: {
    label: 'Watchlist', 
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700/50',
    description: 'Moderate priority - review required'
  },
  3: {
    label: 'Defer',
    color: 'text-red-400', 
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700/50',
    description: 'Low priority - significant gaps'
  }
};

export default function ScoreCard({ score, showDetails = false }: ScoreCardProps) {
  const tierConfig = TIER_CONFIG[score.tier];
  
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">tCredex Score</h3>
          <p className="text-sm text-gray-400">4-Pillar Merit-Based Assessment</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-100">{score.totalScore}</div>
          <div className="text-sm text-gray-400">/ 100</div>
        </div>
      </div>

      {/* Tier Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${tierConfig.bgColor} ${tierConfig.borderColor} border mb-4`}>
        <div className={`w-2 h-2 rounded-full ${tierConfig.color.replace('text-', 'bg-')}`} />
        <span className={tierConfig.color}>Tier {score.tier}: {tierConfig.label}</span>
      </div>
      <p className="text-xs text-gray-500 mb-6">{tierConfig.description}</p>

      {/* Score Breakdown */}
      <div className="space-y-4">
        {/* Economic Distress */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-300">Economic Distress</span>
            <div className="text-xs text-gray-500">Community need assessment</div>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-100">{score.breakdown.economicDistress.score}</span>
            <span className="text-sm text-gray-400">/{score.breakdown.economicDistress.maxScore}</span>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full" 
            style={{ width: `${(score.breakdown.economicDistress.score / score.breakdown.economicDistress.maxScore) * 100}%` }}
          />
        </div>

        {/* Impact Potential */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-300">Impact Potential</span>
            <div className="text-xs text-gray-500">Job creation & community benefit</div>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-100">{score.breakdown.impactPotential.score}</span>
            <span className="text-sm text-gray-400">/{score.breakdown.impactPotential.maxScore}</span>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" 
            style={{ width: `${(score.breakdown.impactPotential.score / score.breakdown.impactPotential.maxScore) * 100}%` }}
          />
        </div>

        {/* Project Readiness */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-300">Project Readiness</span>
            <div className="text-xs text-gray-500">Development stage & feasibility</div>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-100">{score.breakdown.projectReadiness.score}</span>
            <span className="text-sm text-gray-400">/{score.breakdown.projectReadiness.maxScore}</span>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
            style={{ width: `${(score.breakdown.projectReadiness.score / score.breakdown.projectReadiness.maxScore) * 100}%` }}
          />
        </div>

        {/* Mission Fit */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-300">Mission Fit</span>
            <div className="text-xs text-gray-500">Alignment with CDE criteria</div>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-100">{score.breakdown.missionFit.score}</span>
            <span className="text-sm text-gray-400">/{score.breakdown.missionFit.maxScore}</span>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
            style={{ width: `${(score.breakdown.missionFit.score / score.breakdown.missionFit.maxScore) * 100}%` }}
          />
        </div>
      </div>

      {/* Eligibility Flags */}
      {(score.eligibilityFlags.nmtcEligible || score.eligibilityFlags.severelyDistressed) && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="text-sm font-medium text-gray-300 mb-2">Eligibility</div>
          <div className="flex flex-wrap gap-2">
            {score.eligibilityFlags.nmtcEligible && (
              <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded-full border border-emerald-700/50">
                NMTC Eligible
              </span>
            )}
            {score.eligibilityFlags.severelyDistressed && (
              <span className="px-2 py-1 bg-orange-900/30 text-orange-400 text-xs rounded-full border border-orange-700/50">
                Severely Distressed
              </span>
            )}
            {score.eligibilityFlags.qualifiedCensusTracts && (
              <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full border border-blue-700/50">
                QCT
              </span>
            )}
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-6 pt-4 border-t border-gray-800">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-indigo-400 hover:text-indigo-300">
              View Detailed Breakdown
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              {/* Economic Distress Details */}
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Economic Distress Components</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Poverty Rate:</span>
                    <span className="text-gray-300">{score.breakdown.economicDistress.components.povertyPercentile}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">MFI Score:</span>
                    <span className="text-gray-300">{score.breakdown.economicDistress.components.mfiScore}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unemployment:</span>
                    <span className="text-gray-300">{score.breakdown.economicDistress.components.unemploymentPercentile}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Persistent Poverty:</span>
                    <span className="text-gray-300">{score.breakdown.economicDistress.components.persistentPoverty}/3</span>
                  </div>
                </div>
              </div>

              {/* Reason Codes */}
              {score.reasonCodes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Areas for Improvement</h4>
                  <div className="space-y-1">
                    {score.reasonCodes.map((code, index) => (
                      <div key={index} className="text-xs text-amber-400">
                        • {code.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Merit-based scoring • No identity factors</span>
          <span>AI-powered assessment</span>
        </div>
      </div>
    </div>
  );
}