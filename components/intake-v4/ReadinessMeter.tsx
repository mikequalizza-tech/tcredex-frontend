'use client';

import { calculateReadiness, getTierDisplay } from '@/lib/intake';
import { ProgramType, IntakeData } from './IntakeShell';

interface ReadinessMeterProps {
  data: IntakeData;
  programs: ProgramType[];
  onSave?: () => void;
  onSubmit?: () => void;
  isSaving?: boolean;
}

export function ReadinessMeter({ data, programs, onSave, onSubmit, isSaving }: ReadinessMeterProps) {
  const result = calculateReadiness(data);
  const tierDisplay = getTierDisplay(result.tier);

  const suggestions = getSuggestions(data, result);

  return (
    <div className="space-y-4 sticky top-24">
      {/* Readiness Score Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Readiness Score</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#374151" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={result.tier === 'shovel-ready' ? '#10b981' : result.tier === 'advanced' ? '#6366f1' : result.tier === 'developing' ? '#f59e0b' : '#6b7280'}
                strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - result.percentage / 100)} className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-100">{result.totalScore}</span>
            </div>
          </div>
          <div>
            <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
              result.tier === 'shovel-ready' ? 'bg-green-900/50 text-green-400' :
              result.tier === 'advanced' ? 'bg-indigo-900/50 text-indigo-400' :
              result.tier === 'developing' ? 'bg-amber-900/50 text-amber-400' : 'bg-gray-800 text-gray-400'
            }`}>{tierDisplay.label}</div>
            <p className="text-xs text-gray-500 mt-1">out of {result.maxScore} points</p>
          </div>
        </div>

        <div className="space-y-3">
          {result.breakdown.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{item.label}</span>
                <span className={`font-medium ${item.status === 'complete' ? 'text-green-400' : item.status === 'partial' ? 'text-amber-400' : 'text-gray-500'}`}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${item.status === 'complete' ? 'bg-green-500' : item.status === 'partial' ? 'bg-amber-500' : 'bg-gray-700'}`}
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-800">
          {result.totalScore >= 40 ? (
            <div className="flex items-center gap-2 text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Ready for Marketplace</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">Score 40+ to submit</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">TC</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300">ChatTC Suggestions</h3>
        </div>

        {suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.slice(0, 4).map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-amber-400 mt-0.5">💡</span>
                <span className="text-gray-400">{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-400">✓ Looking good! Your submission is well-prepared.</p>
        )}
      </div>

      {/* Program Requirements */}
      {programs.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Program Requirements</h3>
          <div className="space-y-2">
            {programs.map((program) => (
              <div key={program} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  program === 'NMTC' ? 'bg-emerald-900/50 text-emerald-400' :
                  program === 'HTC' ? 'bg-blue-900/50 text-blue-400' :
                  program === 'LIHTC' ? 'bg-purple-900/50 text-purple-400' :
                  'bg-amber-900/50 text-amber-400'
                }`}>{program}</span>
                <span className="text-xs text-gray-500">{getProgramRequirementSummary(program, data)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button onClick={onSave} disabled={isSaving}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50">
            💾 Save Draft
          </button>
          <button onClick={onSubmit} disabled={isSaving || result.totalScore < 40}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
            🚀 Submit to Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(data: IntakeData, result: any): string[] {
  const suggestions: string[] = [];
  if (!data.siteControl || data.siteControl === 'None') suggestions.push('Add site control status to improve readiness score by up to 20 points');
  else if (data.siteControl === 'LOI') suggestions.push('Converting LOI to contract will increase site control score');
  if ((data.committedCapitalPct || 0) < 60) suggestions.push('Identify more capital sources to reach 60%+ commitment level');
  if ((data.docsUploaded || 0) < (data.docsRequired || 8) * 0.5) suggestions.push('Upload core documents to increase documentation score');
  if (!data.entitlementsApproved && !data.entitlementsSubmitted) suggestions.push('Submit entitlement applications to improve approvals score');
  if ((data.constructionStartMonths || 999) > 12) suggestions.push('Projects starting within 12 months score higher on timeline');
  if (data.programs?.includes('NMTC') && data.isProhibitedBusiness === undefined) suggestions.push('Complete QALICB eligibility tests for NMTC');
  if (data.programs?.includes('HTC') && !data.historicStatus) suggestions.push('Confirm historic status for HTC eligibility');
  return suggestions;
}

function getProgramRequirementSummary(program: ProgramType, data: IntakeData): string {
  switch (program) {
    case 'NMTC': return data.qalicbGrossIncome !== undefined && data.isProhibitedBusiness !== undefined ? 'QALICB tests complete' : 'QALICB tests needed';
    case 'HTC': return data.historicStatus && data.part1Status ? `${data.historicStatus}, Part 1 ${data.part1Status}` : 'Historic status needed';
    case 'LIHTC': return data.totalUnits && data.affordableUnits ? `${data.affordableUnits}/${data.totalUnits} affordable units` : 'Unit mix needed';
    case 'OZ': return data.ozInvestmentDate ? 'Investment timeline set' : 'Investment date needed';
    default: return 'Requirements pending';
  }
}

export default ReadinessMeter;
