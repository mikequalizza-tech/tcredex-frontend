'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { fetchCDEPipelineDeals, fetchCDEAllocations, type CDEAllocation } from '@/lib/supabase/queries';
import { Deal } from '@/lib/data/deals';

interface CDEDashboardProps {
  userName: string;
  orgName: string;
}

const STAGE_COLORS: Record<string, string> = {
  draft: 'bg-gray-900/50 text-gray-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  under_review: 'bg-purple-900/50 text-purple-400',
  available: 'bg-amber-900/50 text-amber-400',
  seeking_capital: 'bg-amber-900/50 text-amber-400',
  matched: 'bg-green-900/50 text-green-400',
  closing: 'bg-green-900/50 text-green-400',
  closed: 'bg-gray-900/50 text-gray-400',
  withdrawn: 'bg-red-900/50 text-red-400',
};

export default function CDEDashboard({ userName, orgName }: CDEDashboardProps) {
  const { user } = useCurrentUser();
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]);
  const [allocations, setAllocations] = useState<CDEAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCDEData() {
      if (!user?.organizationId) return;
      
      try {
        const [deals, allocs] = await Promise.all([
          fetchCDEPipelineDeals(user.organizationId),
          fetchCDEAllocations(user.organizationId)
        ]);
        
        setPipelineDeals(deals);
        setAllocations(allocs);
      } catch (error) {
        console.error('Error loading CDE data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCDEData();
  }, [user?.organizationId]);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  // Calculate allocation totals from real data
  const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.awardedAmount, 0);
  const deployedAmount = allocations.reduce((sum, alloc) => sum + alloc.deployedAmount, 0);
  const remainingAllocation = totalAllocation - deployedAmount;

  // Calculate pipeline stats from real deals
  const pipelineStats = {
    new: pipelineDeals.filter(d => d.status === 'submitted' || d.status === 'available').length,
    review: pipelineDeals.filter(d => d.status === 'under_review').length,
    underwriting: pipelineDeals.filter(d => d.status === 'seeking_capital').length,
    closing: pipelineDeals.filter(d => d.status === 'matched' || d.status === 'closing').length,
  };

  const getDaysInStage = (deal: Deal) => {
    const submittedDate = new Date(deal.submittedDate);
    const now = new Date();
    return Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

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
            <p className="text-xl font-bold text-gray-100">{loading ? '...' : formatCurrency(totalAllocation)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Deployed</p>
            <p className="text-xl font-bold text-green-400">{loading ? '...' : formatCurrency(deployedAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Available</p>
            <p className="text-xl font-bold text-indigo-400">{loading ? '...' : formatCurrency(remainingAllocation)}</p>
          </div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className="bg-gradient-to-r from-green-500 to-indigo-500 h-3 rounded-full" style={{ width: totalAllocation > 0 ? `${(deployedAmount / totalAllocation) * 100}%` : '0%' }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{totalAllocation > 0 ? ((deployedAmount / totalAllocation) * 100).toFixed(0) : 0}% deployed • QEI deadline: Dec 31, 2025</p>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">New Submissions</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{loading ? '...' : pipelineStats.new}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">In Review</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{loading ? '...' : pipelineStats.review}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Underwriting</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{loading ? '...' : pipelineStats.underwriting}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">In Closing</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{loading ? '...' : pipelineStats.closing}</p>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading pipeline deals...
                  </td>
                </tr>
              ) : pipelineDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No deals in pipeline yet. <Link href="/deals" className="text-indigo-400 hover:text-indigo-300">Browse marketplace</Link> to find opportunities.
                  </td>
                </tr>
              ) : (
                pipelineDeals.slice(0, 4).map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-100">{deal.projectName}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{deal.sponsorName}</td>
                    <td className="px-6 py-4 text-gray-300">{formatCurrency(deal.allocation)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[deal.status] || STAGE_COLORS.draft}`}>
                        {deal.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{getDaysInStage(deal)}d</td>
                    <td className="px-6 py-4">
                      <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">View →</Link>
                    </td>
                  </tr>
                ))
              )}
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
