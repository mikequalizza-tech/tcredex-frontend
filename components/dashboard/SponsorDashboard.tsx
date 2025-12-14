'use client';

import React from 'react';
import Link from 'next/link';

interface DealSummary {
  id: string;
  projectName: string;
  program: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  status: 'draft' | 'submitted' | 'matched' | 'closing' | 'closed';
  allocation: number;
  creditPrice: number;
  submittedDate?: string;
  matchedDate?: string;
}

interface SponsorDashboardProps {
  userName: string;
  orgName: string;
}

const DEMO_DEALS: DealSummary[] = [
  { id: 'deal-001', projectName: 'Downtown Community Center', program: 'NMTC', status: 'closing', allocation: 15000000, creditPrice: 0.76, submittedDate: '2024-10-15', matchedDate: '2024-11-01' },
  { id: 'deal-002', projectName: 'Heritage Theater Restoration', program: 'HTC', status: 'matched', allocation: 8500000, creditPrice: 0.92, submittedDate: '2024-11-20', matchedDate: '2024-12-05' },
  { id: 'deal-003', projectName: 'Affordable Housing Complex', program: 'LIHTC', status: 'submitted', allocation: 22000000, creditPrice: 0.88, submittedDate: '2024-12-01' },
  { id: 'deal-004', projectName: 'Mixed-Use Development Phase II', program: 'NMTC', status: 'draft', allocation: 12000000, creditPrice: 0.74 },
];

const STATUS_COLORS = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  matched: 'bg-purple-900/50 text-purple-400',
  closing: 'bg-amber-900/50 text-amber-400',
  closed: 'bg-green-900/50 text-green-400',
};

const PROGRAM_COLORS = {
  NMTC: 'bg-emerald-600',
  HTC: 'bg-blue-600',
  LIHTC: 'bg-purple-600',
  OZ: 'bg-amber-600',
};

export default function SponsorDashboard({ userName, orgName }: SponsorDashboardProps) {
  const deals = DEMO_DEALS;
  
  const stats = {
    totalDeals: deals.length,
    inClosing: deals.filter(d => d.status === 'closing').length,
    matched: deals.filter(d => d.status === 'matched').length,
    totalAllocation: deals.reduce((sum, d) => sum + d.allocation, 0),
    avgCreditPrice: deals.reduce((sum, d) => sum + d.creditPrice, 0) / deals.length,
  };

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-indigo-200 mt-1">{orgName} • Sponsor Portal</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/deals/new" className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit New Project
          </Link>
          <Link href="/deals" className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Total Projects</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{stats.totalDeals}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">In Closing</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.inClosing}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Total Allocation</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(stats.totalAllocation)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Avg Credit Price</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">${stats.avgCreditPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Your Projects</h2>
          <Link href="/dashboard/projects" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Allocation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Credit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-100">{deal.projectName}</p>
                    {deal.submittedDate && <p className="text-xs text-gray-500">Submitted {deal.submittedDate}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${PROGRAM_COLORS[deal.program]}`}>
                      {deal.program}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatCurrency(deal.allocation)}</td>
                  <td className="px-6 py-4 text-gray-300">${deal.creditPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status]}`}>
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { icon: '🎉', text: 'Downtown Community Center moved to Closing', time: '2 hours ago', color: 'text-amber-400' },
            { icon: '✅', text: 'Heritage Theater matched with First National Bank', time: '1 day ago', color: 'text-purple-400' },
            { icon: '📄', text: 'Affordable Housing Complex submitted for review', time: '3 days ago', color: 'text-blue-400' },
            { icon: '💬', text: 'New message from CDE partner on Downtown project', time: '5 days ago', color: 'text-gray-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <p className={`text-sm ${item.color}`}>{item.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
