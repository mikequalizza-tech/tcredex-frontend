'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';

interface Investment {
  id: string;
  projectName: string;
  cdeName: string;
  city: string;
  state: string;
  programType: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  investmentAmount: number;
  qeiAmount: number;
  creditsClaimed: number;
  creditsRemaining: number;
  closingDate: string;
  complianceYear: number;
  status: 'active' | 'compliance' | 'exited';
  irr?: number;
}

const DEMO_INVESTMENTS: Investment[] = [
  {
    id: 'inv-1',
    projectName: 'Detroit Tech Incubator',
    cdeName: 'Great Lakes CDE',
    city: 'Detroit',
    state: 'MI',
    programType: 'NMTC',
    investmentAmount: 2500000,
    qeiAmount: 10000000,
    creditsClaimed: 780000,
    creditsRemaining: 3120000,
    closingDate: '2023-06-15',
    complianceYear: 2,
    status: 'active',
    irr: 15.2,
  },
  {
    id: 'inv-2',
    projectName: 'Chicago Healthcare Campus',
    cdeName: 'Midwest Impact Fund',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    investmentAmount: 4000000,
    qeiAmount: 18000000,
    creditsClaimed: 2106000,
    creditsRemaining: 4914000,
    closingDate: '2022-03-20',
    complianceYear: 3,
    status: 'active',
    irr: 16.8,
  },
  {
    id: 'inv-3',
    projectName: 'Milwaukee Workforce Center',
    cdeName: 'Wisconsin Community Fund',
    city: 'Milwaukee',
    state: 'WI',
    programType: 'NMTC',
    investmentAmount: 1800000,
    qeiAmount: 8000000,
    creditsClaimed: 1248000,
    creditsRemaining: 1872000,
    closingDate: '2021-09-10',
    complianceYear: 4,
    status: 'compliance',
    irr: 14.5,
  },
  {
    id: 'inv-4',
    projectName: 'St. Louis Historic Renovation',
    cdeName: 'Gateway CDE',
    city: 'St. Louis',
    state: 'MO',
    programType: 'HTC',
    investmentAmount: 3200000,
    qeiAmount: 0,
    creditsClaimed: 2560000,
    creditsRemaining: 640000,
    closingDate: '2020-11-05',
    complianceYear: 5,
    status: 'compliance',
    irr: 18.2,
  },
  {
    id: 'inv-5',
    projectName: 'Indianapolis Community Center',
    cdeName: 'Heartland Development',
    city: 'Indianapolis',
    state: 'IN',
    programType: 'NMTC',
    investmentAmount: 2000000,
    qeiAmount: 9000000,
    creditsClaimed: 3510000,
    creditsRemaining: 0,
    closingDate: '2017-04-22',
    complianceYear: 7,
    status: 'exited',
    irr: 17.1,
  },
];

export default function PortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}

function PortfolioContent() {
  const { orgName } = useCurrentUser();
  const [investments] = useState<Investment[]>(DEMO_INVESTMENTS);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'compliance' | 'exited'>('all');

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  // Portfolio calculations
  const filteredInvestments = filterStatus === 'all' 
    ? investments 
    : investments.filter(i => i.status === filterStatus);

  const totalInvested = investments.reduce((sum, i) => sum + i.investmentAmount, 0);
  const totalCredits = investments.reduce((sum, i) => sum + i.creditsClaimed + i.creditsRemaining, 0);
  const creditsClaimed = investments.reduce((sum, i) => sum + i.creditsClaimed, 0);
  const creditsRemaining = investments.reduce((sum, i) => sum + i.creditsRemaining, 0);
  const avgIRR = investments.filter(i => i.irr).reduce((sum, i) => sum + (i.irr || 0), 0) / investments.filter(i => i.irr).length;

  const activeCount = investments.filter(i => i.status === 'active').length;
  const complianceCount = investments.filter(i => i.status === 'compliance').length;
  const exitedCount = investments.filter(i => i.status === 'exited').length;

  const getStatusBadge = (status: Investment['status']) => {
    const styles = {
      active: 'bg-green-900/50 text-green-400',
      compliance: 'bg-yellow-900/50 text-yellow-400',
      exited: 'bg-gray-800 text-gray-400',
    };
    const labels = {
      active: 'Active',
      compliance: 'In Compliance',
      exited: 'Exited',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Investment Portfolio</h1>
          <p className="text-gray-400 mt-1">{orgName || 'Demo Investment Fund'}</p>
        </div>
        <Link
          href="/deals"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        >
          Browse New Opportunities
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Total Invested</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Total Credits</div>
          <div className="text-2xl font-bold text-indigo-400">{formatCurrency(totalCredits)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Credits Claimed</div>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(creditsClaimed)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Credits Remaining</div>
          <div className="text-2xl font-bold text-amber-400">{formatCurrency(creditsRemaining)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Avg. IRR</div>
          <div className="text-2xl font-bold text-purple-400">{avgIRR.toFixed(1)}%</div>
        </div>
      </div>

      {/* Credit Progress */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Credit Utilization</h2>
          <span className="text-sm text-gray-400">
            {((creditsClaimed / totalCredits) * 100).toFixed(0)}% claimed
          </span>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${(creditsClaimed / totalCredits) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-emerald-400">Claimed: {formatCurrency(creditsClaimed)}</span>
          <span className="text-amber-400">Remaining: {formatCurrency(creditsRemaining)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All ({investments.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilterStatus('compliance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'compliance' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          In Compliance ({complianceCount})
        </button>
        <button
          onClick={() => setFilterStatus('exited')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'exited' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Exited ({exitedCount})
        </button>
      </div>

      {/* Investments Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">CDE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Investment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Credits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Year</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IRR</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredInvestments.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-100">{inv.projectName}</p>
                    <p className="text-sm text-gray-500">{inv.city}, {inv.state}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-300 text-sm">{inv.cdeName}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inv.programType === 'NMTC' ? 'bg-indigo-900/50 text-indigo-400' :
                    inv.programType === 'HTC' ? 'bg-amber-900/50 text-amber-400' :
                    inv.programType === 'LIHTC' ? 'bg-green-900/50 text-green-400' :
                    'bg-purple-900/50 text-purple-400'
                  }`}>
                    {inv.programType}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-100">{formatCurrency(inv.investmentAmount)}</span>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm text-emerald-400">{formatCurrency(inv.creditsClaimed)} claimed</div>
                    <div className="text-xs text-gray-500">{formatCurrency(inv.creditsRemaining)} remaining</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-300">Year {inv.complianceYear}</td>
                <td className="px-4 py-4">
                  <span className="font-medium text-purple-400">{inv.irr?.toFixed(1)}%</span>
                </td>
                <td className="px-4 py-4">{getStatusBadge(inv.status)}</td>
                <td className="px-4 py-4">
                  <button 
                    onClick={() => setSelectedInvestment(inv)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Details →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Investment Detail Modal */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedInvestment(null)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedInvestment.projectName}</h3>
                <p className="text-gray-400">{selectedInvestment.cdeName} • {selectedInvestment.city}, {selectedInvestment.state}</p>
              </div>
              <button onClick={() => setSelectedInvestment(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Investment</div>
                <div className="text-xl font-bold text-white">{formatCurrency(selectedInvestment.investmentAmount)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Total Credits</div>
                <div className="text-xl font-bold text-indigo-400">
                  {formatCurrency(selectedInvestment.creditsClaimed + selectedInvestment.creditsRemaining)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">IRR</div>
                <div className="text-xl font-bold text-purple-400">{selectedInvestment.irr?.toFixed(1)}%</div>
              </div>
            </div>

            {/* Credit Schedule */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Credit Claim Schedule</h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map(year => {
                  const yearCredits = (selectedInvestment.creditsClaimed + selectedInvestment.creditsRemaining) / 7;
                  const isClaimed = year <= selectedInvestment.complianceYear;
                  return (
                    <div key={year} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isClaimed ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {year}
                      </div>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isClaimed ? 'bg-emerald-500' : 'bg-gray-700'}`}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div className={`text-sm ${isClaimed ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {formatCurrency(yearCredits)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Closing Date</span>
                <p className="text-gray-200">{new Date(selectedInvestment.closingDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Compliance Year</span>
                <p className="text-gray-200">Year {selectedInvestment.complianceYear} of 7</p>
              </div>
              <div>
                <span className="text-gray-500">QEI Amount</span>
                <p className="text-gray-200">{formatCurrency(selectedInvestment.qeiAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p className="mt-1">{getStatusBadge(selectedInvestment.status)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">
                View Documents
              </button>
              <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
