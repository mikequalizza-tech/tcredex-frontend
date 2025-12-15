'use client';

import React from 'react';
import Link from 'next/link';

interface CDEDashboardProps {
  userName: string;
  orgName: string;
}

const PIPELINE_DEALS = [
  { id: 'deal-001', projectName: 'Downtown Community Center', sponsor: 'Metro Development Corp', program: 'NMTC', allocation: 15000000, stage: 'closing', daysInStage: 12 },
  { id: 'deal-008', projectName: 'Rural Health Clinic Network', sponsor: 'HealthFirst Foundation', program: 'NMTC', allocation: 12000000, stage: 'underwriting', daysInStage: 5 },
  { id: 'deal-012', projectName: 'Workforce Training Center', sponsor: 'Skills Development Corp', program: 'NMTC', allocation: 9000000, stage: 'review', daysInStage: 3 },
  { id: 'deal-010', projectName: 'Eastside Grocery Co-Op', sponsor: 'Food Access Initiative', program: 'NMTC', allocation: 4500000, stage: 'new', daysInStage: 1 },
];

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-900/50 text-blue-400',
  review: 'bg-purple-900/50 text-purple-400',
  underwriting: 'bg-amber-900/50 text-amber-400',
  closing: 'bg-green-900/50 text-green-400',
};

export default function CDEDashboard({ userName, orgName }: CDEDashboardProps) {
  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const allocationRemaining = 45000000;
  const allocationUsed = 85000000;
  const totalAllocation = allocationRemaining + allocationUsed;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {userName.split(' ')[0]}!</h1>
        <p className="text-purple-200 mt-1">{orgName} • CDE Portal</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/deals" className="inline-flex items-center px-4 py-2 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors">
            Browse Marketplace
          </Link>
          <Link href="/dashboard/pipeline" className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition-colors">
            Manage Pipeline
          </Link>
        </div>
      </div>

      {/* Allocation Tracker */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">NMTC Allocation</h2>
          <span className="text-sm text-gray-400">CY 2024</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Total Allocation</p>
            <p className="text-xl font-bold text-gray-100">{formatCurrency(totalAllocation)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Deployed</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(allocationUsed)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Available</p>
            <p className="text-xl font-bold text-indigo-400">{formatCurrency(allocationRemaining)}</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="bg-gradient-to-r from-green-500 to-indigo-500 h-3 rounded-full" style={{ width: `${(allocationUsed / totalAllocation) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{((allocationUsed / totalAllocation) * 100).toFixed(0)}% deployed • QEI deadline: Dec 31, 2024</p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">New Submissions</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">3</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">In Review</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">5</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Underwriting</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">4</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">In Closing</p>
          <p className="text-2xl font-bold text-green-400 mt-1">2</p>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Active Pipeline</h2>
          <Link href="/dashboard/pipeline" className="text-sm text-indigo-400 hover:text-indigo-300">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sponsor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Allocation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Days</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {PIPELINE_DEALS.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-100">{deal.projectName}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{deal.sponsor}</td>
                  <td className="px-6 py-4 text-gray-300">{formatCurrency(deal.allocation)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.stage]}`}>
                      {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{deal.daysInStage}d</td>
                  <td className="px-6 py-4">
                    <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/deals" className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-600 transition-colors group">
          <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
            <svg className="w-6 h-6 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-100">Find Projects</h3>
          <p className="text-sm text-gray-400 mt-1">Browse marketplace for new opportunities</p>
        </Link>
        <Link href="/dashboard/automatch" className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-purple-600 transition-colors group">
          <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
            <svg className="w-6 h-6 text-purple-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-100">AutoMatch AI</h3>
          <p className="text-sm text-gray-400 mt-1">Get AI-powered project recommendations</p>
        </Link>
        <Link href="/closing-room" className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-green-600 transition-colors group">
          <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
            <svg className="w-6 h-6 text-green-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-100">Closing Room</h3>
          <p className="text-sm text-gray-400 mt-1">Manage active closings and documents</p>
        </Link>
      </div>
    </div>
  );
}
