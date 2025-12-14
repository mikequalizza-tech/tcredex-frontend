'use client';

import React from 'react';
import Link from 'next/link';

interface InvestorDashboardProps {
  userName: string;
  orgName: string;
}

const INVESTMENTS = [
  { id: 'inv-001', projectName: 'Downtown Community Center', cde: 'Enterprise Community', program: 'NMTC', invested: 5000000, creditPrice: 0.76, status: 'active', craEligible: true },
  { id: 'inv-002', projectName: 'Heritage Theater', cde: 'US Bancorp CDC', program: 'HTC', invested: 3200000, creditPrice: 0.92, status: 'active', craEligible: true },
  { id: 'inv-003', projectName: 'Riverside Apartments', cde: 'N/A', program: 'LIHTC', invested: 8500000, creditPrice: 0.88, status: 'active', craEligible: true },
];

const MATCHES = [
  { id: 'm-001', projectName: 'Rural Health Clinic Network', program: 'NMTC', allocation: 12000000, matchScore: 94, state: 'Iowa' },
  { id: 'm-002', projectName: 'Workforce Training Center', program: 'NMTC', allocation: 9000000, matchScore: 89, state: 'Missouri' },
  { id: 'm-003', projectName: 'Arts District Lofts', program: 'HTC', allocation: 14000000, matchScore: 87, state: 'Pennsylvania' },
];

const PROGRAM_COLORS: Record<string, string> = {
  NMTC: 'bg-emerald-600',
  HTC: 'bg-blue-600',
  LIHTC: 'bg-purple-600',
  OZ: 'bg-amber-600',
};

export default function InvestorDashboard({ userName, orgName }: InvestorDashboardProps) {
  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const totalInvested = INVESTMENTS.reduce((sum, inv) => sum + inv.invested, 0);
  const craCredits = INVESTMENTS.filter(inv => inv.craEligible).reduce((sum, inv) => sum + inv.invested, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-blue-200 mt-1">{orgName} • Investor Portal</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/deals" className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Browse Marketplace
          </Link>
          <Link href="/dashboard/automatch" className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors">
            View AI Matches
          </Link>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Total Invested</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Active Investments</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{INVESTMENTS.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">CRA Credits</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(craCredits)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">New Matches</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{MATCHES.length}</p>
        </div>
      </div>

      {/* AI Matches */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-100">AutoMatch Recommendations</h2>
            <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded-full">AI-Powered</span>
          </div>
          <Link href="/dashboard/automatch" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
        </div>
        <div className="divide-y divide-gray-800">
          {MATCHES.map((match) => (
            <div key={match.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-500">{match.matchScore}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-100">{match.projectName}</p>
                  <p className="text-sm text-gray-500">{match.state} • {formatCurrency(match.allocation)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${PROGRAM_COLORS[match.program]}`}>
                  {match.program}
                </span>
                <Link href={`/deals/${match.id}`} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">
                  View Deal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Active Portfolio</h2>
          <Link href="/dashboard/portfolio" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">CDE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">CRA</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {INVESTMENTS.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-100">{inv.projectName}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{inv.cde}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${PROGRAM_COLORS[inv.program]}`}>
                      {inv.program}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatCurrency(inv.invested)}</td>
                  <td className="px-6 py-4">
                    {inv.craEligible ? (
                      <span className="text-green-400">✓ Eligible</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/deals/${inv.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRA Summary */}
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">CRA Compliance Summary</h3>
            <p className="text-sm text-gray-400">All investments qualify for CRA credit</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Low-Income Areas</p>
            <p className="text-lg font-bold text-green-400">100%</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Assessment Area</p>
            <p className="text-lg font-bold text-green-400">3 of 3</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Community Impact</p>
            <p className="text-lg font-bold text-green-400">High</p>
          </div>
        </div>
      </div>
    </div>
  );
}
