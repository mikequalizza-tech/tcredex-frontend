'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Investment {
  id: string;
  projectName: string;
  cde: string;
  location: string;
  creditType: 'NMTC' | 'LIHTC' | 'HTC' | 'OZ';
  investmentAmount: number;
  creditAmount: number;
  status: 'active' | 'compliance' | 'exited';
  closedDate: string;
  craEligible: boolean;
  irr: number;
  yearsRemaining: number;
}

const demoInvestments: Investment[] = [
  {
    id: 'I001',
    projectName: 'Eastside Grocery Co-Op',
    cde: 'Midwest Community Development',
    location: 'Springfield, IL',
    creditType: 'NMTC',
    investmentAmount: 5000000,
    creditAmount: 1950000,
    status: 'active',
    closedDate: '2024-03-15',
    craEligible: true,
    irr: 8.2,
    yearsRemaining: 6,
  },
  {
    id: 'I002',
    projectName: 'Heritage Arts Center',
    cde: 'National Trust CDE',
    location: 'Baltimore, MD',
    creditType: 'HTC',
    investmentAmount: 3000000,
    creditAmount: 600000,
    status: 'active',
    closedDate: '2024-01-20',
    craEligible: true,
    irr: 7.5,
    yearsRemaining: 4,
  },
  {
    id: 'I003',
    projectName: 'Northgate Health Center',
    cde: 'Healthcare Finance CDE',
    location: 'Detroit, MI',
    creditType: 'NMTC',
    investmentAmount: 8000000,
    creditAmount: 3120000,
    status: 'compliance',
    closedDate: '2023-06-10',
    craEligible: true,
    irr: 9.1,
    yearsRemaining: 5,
  },
  {
    id: 'I004',
    projectName: 'Riverfront Apartments',
    cde: 'Affordable Housing Partners',
    location: 'Memphis, TN',
    creditType: 'LIHTC',
    investmentAmount: 12000000,
    creditAmount: 10800000,
    status: 'active',
    closedDate: '2024-08-01',
    craEligible: true,
    irr: 6.8,
    yearsRemaining: 9,
  },
];

const creditTypeColors: Record<string, string> = {
  NMTC: 'bg-green-900/50 text-green-300 border-green-500/30',
  LIHTC: 'bg-blue-900/50 text-blue-300 border-blue-500/30',
  HTC: 'bg-amber-900/50 text-amber-300 border-amber-500/30',
  OZ: 'bg-purple-900/50 text-purple-300 border-purple-500/30',
};

export default function PortfolioPage() {
  const [investments] = useState<Investment[]>(demoInvestments);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredInvestments = filterType === 'all'
    ? investments
    : investments.filter(i => i.creditType === filterType);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  // Portfolio stats
  const totalInvested = investments.reduce((sum, i) => sum + i.investmentAmount, 0);
  const totalCredits = investments.reduce((sum, i) => sum + i.creditAmount, 0);
  const avgIRR = investments.reduce((sum, i) => sum + i.irr, 0) / investments.length;
  const craCount = investments.filter(i => i.craEligible).length;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Portfolio</h1>
          <p className="text-gray-400 mt-1">Track your tax credit investments and performance.</p>
        </div>
        <Link
          href="/investor"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Find New Deals
        </Link>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Credits</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Avg IRR</p>
          <p className="text-2xl font-bold text-amber-400">{avgIRR.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">CRA Eligible</p>
          <p className="text-2xl font-bold text-purple-400">{craCount} of {investments.length}</p>
        </div>
      </div>

      {/* Credit Type Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'NMTC', 'LIHTC', 'HTC', 'OZ'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {type === 'all' ? 'All Credits' : type}
          </button>
        ))}
      </div>

      {/* Investments Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Investment</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Credit Type</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Credits</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">IRR</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestments.map((investment) => (
              <tr key={investment.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-200">{investment.projectName}</p>
                    <p className="text-xs text-gray-500">{investment.cde} • {investment.location}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${creditTypeColors[investment.creditType]}`}>
                    {investment.creditType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-200 font-medium">{formatCurrency(investment.investmentAmount)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-400 font-medium">{formatCurrency(investment.creditAmount)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-amber-400 font-medium">{investment.irr}%</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      investment.status === 'active' ? 'bg-green-500' :
                      investment.status === 'compliance' ? 'bg-amber-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-400 capitalize">{investment.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{investment.yearsRemaining} years remaining</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/portfolio/${investment.id}`}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CRA Summary */}
      <div className="mt-8 bg-indigo-900/20 rounded-xl border border-indigo-500/30 p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">CRA Summary</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">CRA-Eligible Investments</p>
            <p className="text-xl font-bold text-indigo-400">{formatCurrency(
              investments.filter(i => i.craEligible).reduce((sum, i) => sum + i.investmentAmount, 0)
            )}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Assessment Areas Covered</p>
            <p className="text-xl font-bold text-indigo-400">4 MSAs</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Community Impact</p>
            <p className="text-xl font-bold text-indigo-400">High</p>
          </div>
        </div>
      </div>
    </div>
  );
}
