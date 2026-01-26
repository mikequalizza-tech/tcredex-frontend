'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api/fetch-utils';

type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ' | 'BROWNFIELD' | 'STATE';

interface DashboardStats {
  totalDeals: number;
  totalAllocation: number;
  inClosing: number;
  matched: number;
  activeCDEs: number;
  activeInvestors: number;
  totalNMTCAvailable: number;
}

interface InterestItem {
  id: string;
  name: string;
  organizationId: string;
  programs: ProgramType[];
  allocation?: number;
  availableAllocation?: number;
  matchScore?: number;
  dealId?: string;
  dealName?: string;
}

interface InterestByProgram {
  program: ProgramType;
  label: string;
  cdes: InterestItem[];
  investors: InterestItem[];
}

interface SponsorDashboardProps {
  userName: string;
  orgName: string;
  organizationId?: string;
}

const PROGRAM_COLORS: Record<ProgramType, string> = {
  NMTC: 'bg-emerald-600',
  HTC: 'bg-blue-600',
  LIHTC: 'bg-purple-600',
  OZ: 'bg-amber-600',
  BROWNFIELD: 'bg-orange-600',
  STATE: 'bg-indigo-600',
};

const PROGRAM_LABELS: Record<ProgramType, string> = {
  NMTC: 'NMTC',
  HTC: 'HTC',
  LIHTC: 'LIHTC',
  OZ: 'OZ',
  BROWNFIELD: 'Brownfield',
  STATE: 'State',
};

export default function SponsorDashboard({ userName, orgName, organizationId }: SponsorDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    totalAllocation: 0,
    inClosing: 0,
    matched: 0,
    activeCDEs: 0,
    activeInvestors: 0,
    totalNMTCAvailable: 0,
  });
  const [interest, setInterest] = useState<InterestByProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InterestItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load stats
        const statsResult = await fetchApi<{ stats: DashboardStats }>('/api/dashboard/stats');
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data.stats);
        }

        // Load interest data
        const interestResult = await fetchApi<{ interest: InterestByProgram[] }>('/api/dashboard/interest');
        if (interestResult.success && interestResult.data) {
          setInterest(interestResult.data.interest);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [organizationId]);

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const handleItemClick = (item: InterestItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

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
            Browse Deals
          </Link>
        </div>
      </div>

      {/* Stats Grid - Real Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Your Projects</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{stats.totalDeals}</p>
          {stats.totalAllocation > 0 && (
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalAllocation)} total</p>
          )}
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">NMTC Available</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(stats.totalNMTCAvailable)}</p>
          <p className="text-xs text-emerald-300">Market allocation</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Active CDEs</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.activeCDEs}</p>
          <p className="text-xs text-purple-300">With allocation</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Active Investors</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.activeInvestors}</p>
          <p className="text-xs text-blue-300">All programs</p>
        </div>
      </div>

      {/* CDE & Investor Interest - By Credit Type */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">CDE & Investor Interest</h2>
          <Link href="/map" className="text-sm text-indigo-400 hover:text-indigo-300">Find More →</Link>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : interest.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No interest data available yet.</p>
            <p className="text-xs text-gray-500 mt-1">Interest will appear here as CDEs and investors engage with your projects.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {interest.map((programInterest) => (
              <div key={programInterest.program} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${PROGRAM_COLORS[programInterest.program]} rounded-full`}></div>
                  <h3 className="font-medium text-gray-300">{programInterest.label}</h3>
                  <span className="text-xs text-gray-500">
                    ({programInterest.cdes.length} CDEs, {programInterest.investors.length} Investors)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CDEs for this program */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">CDEs Interested</h4>
                    {programInterest.cdes.length === 0 ? (
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500">No CDE interest yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {programInterest.cdes.slice(0, 5).map((cde) => (
                          <div
                            key={cde.id}
                            onClick={() => handleItemClick(cde)}
                            className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-indigo-500 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">{cde.name}</p>
                                {cde.availableAllocation && cde.availableAllocation > 0 && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatCurrency(cde.availableAllocation)} available
                                  </p>
                                )}
                                {cde.matchScore && (
                                  <p className="text-xs text-purple-400 mt-1">Match: {cde.matchScore}%</p>
                                )}
                              </div>
                              {cde.dealName && (
                                <span className="text-xs text-gray-500 ml-2 truncate max-w-[120px]" title={cde.dealName}>
                                  {cde.dealName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {programInterest.cdes.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{programInterest.cdes.length - 5} more CDEs
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Investors for this program */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Investors Interested</h4>
                    {programInterest.investors.length === 0 ? (
                      <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500">No investor interest yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {programInterest.investors.slice(0, 5).map((investor) => (
                          <div
                            key={investor.id}
                            onClick={() => handleItemClick(investor)}
                            className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">{investor.name}</p>
                                {investor.programs && investor.programs.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {investor.programs.map(p => PROGRAM_LABELS[p]).join(', ')}
                                  </p>
                                )}
                              </div>
                              {investor.dealName && (
                                <span className="text-xs text-gray-500 ml-2 truncate max-w-[120px]" title={investor.dealName}>
                                  {investor.dealName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {programInterest.investors.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{programInterest.investors.length - 5} more investors
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">{selectedItem.name}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400">Programs</p>
                <p className="text-gray-200 mt-1">
                  {selectedItem.programs.map(p => PROGRAM_LABELS[p]).join(', ') || 'N/A'}
                </p>
              </div>
              {selectedItem.availableAllocation && selectedItem.availableAllocation > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Available Allocation</p>
                  <p className="text-gray-200 mt-1">{formatCurrency(selectedItem.availableAllocation)}</p>
                </div>
              )}
              {selectedItem.matchScore && (
                <div>
                  <p className="text-sm text-gray-400">Match Score</p>
                  <p className="text-gray-200 mt-1">{selectedItem.matchScore}%</p>
                </div>
              )}
              {selectedItem.dealName && (
                <div>
                  <p className="text-sm text-gray-400">Interested In</p>
                  <p className="text-gray-200 mt-1">{selectedItem.dealName}</p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-800">
                <Link
                  href={`/deals/${selectedItem.dealId || ''}`}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Deal Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* TODO: Replace with real activity data from Supabase */}
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-xs text-gray-600 mt-1">Activity will appear here as you interact with CDEs and investors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
