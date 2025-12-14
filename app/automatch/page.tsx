'use client';

import { useState } from 'react';
import MatchScore from '@/components/automatch/MatchScore';
import { 
  calculateMatchScore, 
  type Project, 
  type CDEProfile,
  isQALICBEligible,
  type QALICBInput,
  getFailedTests
} from '@/lib/automatch';

export default function AutoMatchPage() {
  const [matchResult, setMatchResult] = useState<number | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; failed: string[] } | null>(null);

  // Demo project
  const project: Project = {
    state: 'IL',
    severely_distressed: true,
    programs: ['NMTC', 'HTC'],
    impact_score: 82,
    project_type: 'Real Estate'
  };

  // Demo CDE
  const cdeProfile: CDEProfile = {
    focus_state: 'IL',
    programs: ['NMTC', 'HTC'],
    preferred_type: 'Real Estate'
  };

  // Demo QALICB inputs
  const qalicbInput: QALICBInput = {
    gross_income_test: true,
    tangible_property_test: true,
    services_test: true,
    collectibles_test: true,
    financial_property_test: true,
    prohibited_business: false,
    active_business: true,
  };

  const runMatch = () => {
    const score = calculateMatchScore(project, cdeProfile);
    setMatchResult(score);
  };

  const runEligibility = () => {
    const eligible = isQALICBEligible(qalicbInput);
    const failed = getFailedTests(qalicbInput);
    setEligibilityResult({ eligible, failed });
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AutoMatch AI</h1>
          <p className="text-gray-400 mt-1">
            Test CDE matching and QALICB eligibility engines
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Match Score Section */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100">CDE Match Score</h2>
            
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Project:</strong> {project.state}, {project.project_type}</p>
              <p><strong>Programs:</strong> {project.programs.join(', ')}</p>
              <p><strong>Severely Distressed:</strong> {project.severely_distressed ? 'Yes' : 'No'}</p>
            </div>

            <button
              onClick={runMatch}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
            >
              Calculate Match Score
            </button>

            {matchResult !== null && <MatchScore score={matchResult} />}
          </div>

          {/* Eligibility Section */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-100">QALICB Eligibility</h2>
            
            <div className="text-sm text-gray-400 space-y-1">
              <p>✓ Gross Income Test</p>
              <p>✓ Tangible Property Test</p>
              <p>✓ Services Test</p>
              <p>✓ Active Business</p>
            </div>

            <button
              onClick={runEligibility}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
            >
              Check Eligibility
            </button>

            {eligibilityResult && (
              <div className={`p-4 rounded-lg border ${
                eligibilityResult.eligible
                  ? 'bg-green-900/30 border-green-600'
                  : 'bg-red-900/30 border-red-600'
              }`}>
                <p className={eligibilityResult.eligible ? 'text-green-400' : 'text-red-400'}>
                  {eligibilityResult.eligible ? '✓ QALICB Eligible' : '✗ Not Eligible'}
                </p>
                {eligibilityResult.failed.length > 0 && (
                  <ul className="mt-2 text-sm text-red-300">
                    {eligibilityResult.failed.map(f => <li key={f}>• {f}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
