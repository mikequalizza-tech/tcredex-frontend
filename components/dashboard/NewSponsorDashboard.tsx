'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';
import { fetchDealsByOrganization } from '@/lib/supabase/queries';
import MessagingButton from '@/components/messaging/MessagingButton';

interface DealSummary {
  id: string;
  projectName: string;
  program: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  status: 'draft' | 'submitted' | 'matched' | 'closing' | 'closed';
  tcBasis: number; // Tax Credit Basis (universal across all programs)
  tCredexScore?: number;
  tier?: 1 | 2 | 3;
  submittedDate?: string;
  matchedCDE?: string;
  interestedCDEs?: number;
  interestedInvestors?: number;
  views?: number;
  city: string;
  state: string;
}

interface MarketOpportunity {
  program: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  totalAvailable: string;
  activeCDEs: number;
  activeInvestors: number;
  avgCreditPrice: number;
  demandLevel: 'High' | 'Medium' | 'Low';
  trendDirection: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'cde_interest' | 'investor_interest' | 'message' | 'match' | 'view';
  title: string;
  description: string;
  dealName?: string;
  timestamp: string;
  actionable?: boolean;
}

interface SponsorDashboardProps {
  userName: string;
  orgName: string;
  organizationId?: string;
}

const PROGRAM_COLORS = {
  NMTC: 'bg-emerald-600',
  HTC: 'bg-blue-600', 
  LIHTC: 'bg-purple-600',
  OZ: 'bg-amber-600',
};

const STATUS_COLORS = {
  draft: 'bg-gray-800 text-gray-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  matched: 'bg-purple-900/50 text-purple-400',
  closing: 'bg-amber-900/50 text-amber-400',
  closed: 'bg-green-900/50 text-green-400',
};

// Mock market data - in production, this would come from APIs
const MARKET_OPPORTUNITIES: MarketOpportunity[] = [
  {
    program: 'NMTC',
    totalAvailable: '$10B',
    activeCDEs: 847,
    activeInvestors: 1200,
    avgCreditPrice: 0.85,
    demandLevel: 'High',
    trendDirection: 'up'
  },
  {
    program: 'LIHTC',
    totalAvailable: '$12.5B',
    activeCDEs: 0, // LIHTC doesn't use CDEs
    activeInvestors: 2100,
    avgCreditPrice: 0.92,
    demandLevel: 'High',
    trendDirection: 'up'
  },
  {
    program: 'HTC',
    totalAvailable: '$1.8B',
    activeCDEs: 0,
    activeInvestors: 650,
    avgCreditPrice: 0.88,
    demandLevel: 'Medium',
    trendDirection: 'stable'
  },
  {
    program: 'OZ',
    totalAvailable: 'Unlimited',
    activeCDEs: 0,
    activeInvestors: 890,
    avgCreditPrice: 0.0, // OZ is different - capital gains benefit
    demandLevel: 'Medium',
    trendDirection: 'down'
  }
];

export default function NewSponsorDashboard({ userName, orgName, organizationId }: SponsorDashboardProps) {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<'ALL' | 'NMTC' | 'HTC' | 'LIHTC' | 'OZ'>('ALL');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (hasFetched) return;

    async function loadData() {
      if (!organizationId) {
        setDeals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasFetched(true); // Mark as fetched immediately
      try {
        const fetchedDeals = await fetchDealsByOrganization(organizationId);
        
        // Enhanced deal mapping with mock engagement data
        const mappedDeals: DealSummary[] = fetchedDeals.map((d, index) => ({
          id: d.id,
          projectName: d.projectName,
          program: d.programType as any,
          status: d.status as any,
          tcBasis: d.allocation, // Tax Credit Basis - for NMTC this is allocation, for HTC/LIHTC it's the basis amount
          tCredexScore: 75 + (index * 5), // Mock scores
          tier: (index % 3) + 1 as 1 | 2 | 3,
          submittedDate: d.submittedDate,
          matchedCDE: d.status === 'matched' ? 'Demo CDE Partners' : undefined,
          interestedCDEs: Math.floor(Math.random() * 12) + 3,
          interestedInvestors: Math.floor(Math.random() * 25) + 8,
          views: Math.floor(Math.random() * 150) + 50,
          city: d.city,
          state: d.state,
        }));
        
        setDeals(mappedDeals);
        
        // Generate mock recent activity
        const activities: RecentActivity[] = [
          {
            id: '1',
            type: 'cde_interest',
            title: 'New CDE Interest',
            description: 'Metro Development CDE expressed interest in your project',
            dealName: mappedDeals[0]?.projectName,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            actionable: true
          },
          {
            id: '2', 
            type: 'investor_interest',
            title: 'Investor Inquiry',
            description: 'Capital Impact Partners wants to discuss LIHTC investment',
            dealName: mappedDeals[1]?.projectName,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            actionable: true
          },
          {
            id: '3',
            type: 'message',
            title: 'New Message',
            description: 'You have 2 unread messages about deal terms',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            actionable: true
          },
          {
            id: '4',
            type: 'view',
            title: 'Deal Views',
            description: 'Your projects received 47 views in the last 24 hours',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            actionable: false
          }
        ];
        
        setRecentActivity(activities);
      } catch (error) {
        console.error('Failed to load deals:', error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [organizationId, hasFetched]);

  const filteredDeals = selectedProgram === 'ALL' 
    ? deals 
    : deals.filter(d => d.program === selectedProgram);

  const stats = {
    totalDeals: deals.length,
    activeDeals: deals.filter(d => ['submitted', 'matched', 'closing'].includes(d.status)).length,
    totalTCBasis: deals.reduce((sum, d) => sum + d.tcBasis, 0), // Total Tax Credit Basis
    matchedDeals: deals.filter(d => d.status === 'matched').length,
    totalViews: deals.reduce((sum, d) => sum + (d.views || 0), 0),
    totalInterest: deals.reduce((sum, d) => sum + (d.interestedCDEs || 0) + (d.interestedInvestors || 0), 0),
  };

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const getTierColor = (tier: number | undefined) => {
    switch (tier) {
      case 1: return 'text-green-400 bg-green-900/30';
      case 2: return 'text-amber-400 bg-amber-900/30';
      case 3: return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getTierLabel = (tier: number | undefined) => {
    switch (tier) {
      case 1: return 'Greenlight';
      case 2: return 'Watchlist';
      case 3: return 'Defer';
      default: return 'Unscored';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {userName.split(' ')[0]}! 🚀</h1>
              <p className="text-indigo-200 text-lg">{orgName} • Sponsor Command Center</p>
            </div>
            <div className="flex gap-3">
              <MessagingButton className="bg-white/20 hover:bg-white/30 backdrop-blur-sm" />
              <Link 
                href="/intake?new=true" 
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit New Project
              </Link>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-indigo-200 text-sm">Active Projects</p>
              <p className="text-2xl font-bold">{stats.activeDeals}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-indigo-200 text-sm">Total TC Basis</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalTCBasis)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-indigo-200 text-sm">Market Interest</p>
              <p className="text-2xl font-bold">{stats.totalInterest}</p>
              <p className="text-xs text-indigo-300">CDEs + Investors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-indigo-200 text-sm">Profile Views</p>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-indigo-300">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Status & Interest */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">📊 Pipeline Status & Interest</h2>
          <Link href="/dashboard/pipeline" className="text-sm text-indigo-400 hover:text-indigo-300">
            View Full Pipeline →
          </Link>
        </div>
        <div className="p-6">
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No deal activity yet</h3>
              <p className="text-gray-500 mb-4">Submit your first project to start tracking interest</p>
              <Link
                href="/intake?new=true"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Submit First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.slice(0, 6).map(deal => (
                <div key={deal.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 text-sm mb-1 truncate">{deal.projectName}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PROGRAM_COLORS[deal.program]} text-white`}>
                          {deal.program}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[deal.status]}`}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">TC Basis:</span>
                      <span className="text-xs font-medium text-indigo-400">{formatCurrency(deal.tcBasis)}</span>
                    </div>
                    
                    {/* Interest Indicators */}
                    <div className="space-y-1">
                      {deal.program === 'NMTC' && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">CDE Interest:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-purple-400">{deal.interestedCDEs || 0}</span>
                            {(deal.interestedCDEs || 0) > 0 && (
                              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Investor Interest:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-blue-400">{deal.interestedInvestors || 0}</span>
                          {(deal.interestedInvestors || 0) > 0 && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Profile Views:</span>
                        <span className="text-xs font-medium text-green-400">{deal.views || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="pt-2 border-t border-gray-700">
                    {deal.status === 'matched' && deal.matchedCDE ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-400">Matched: {deal.matchedCDE}</span>
                      </div>
                    ) : deal.status === 'submitted' ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-400">Active in marketplace</span>
                      </div>
                    ) : deal.status === 'draft' ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-400">Draft - needs completion</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <span className="text-xs text-amber-400">In progress</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Projects */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">Your Projects</h2>
            <div className="flex gap-2">
              {['ALL', 'NMTC', 'LIHTC', 'HTC', 'OZ'].map(program => (
                <button
                  key={program}
                  onClick={() => setSelectedProgram(program as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedProgram === program
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {program}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Start by submitting your first tax credit project</p>
                <Link
                  href="/intake?new=true"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map(deal => (
                  <div key={deal.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-100">{deal.projectName}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[deal.status]}`}>
                            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PROGRAM_COLORS[deal.program]} text-white`}>
                            {deal.program}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{deal.city}, {deal.state}</p>
                      </div>
                      {deal.tCredexScore && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{deal.tCredexScore}</div>
                          <div className={`text-xs px-2 py-0.5 rounded ${getTierColor(deal.tier)}`}>
                            {getTierLabel(deal.tier)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">TC Basis</p>
                        <p className="text-sm font-medium text-indigo-400">{formatCurrency(deal.tcBasis)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Interest</p>
                        <p className="text-sm font-medium text-green-400">
                          {(deal.interestedCDEs || 0) + (deal.interestedInvestors || 0)} parties
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Views</p>
                        <p className="text-sm font-medium text-blue-400">{deal.views || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-medium text-gray-300">
                          {deal.matchedCDE ? `Matched: ${deal.matchedCDE}` : 'Seeking Match'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <MessagingButton dealId={deal.id} className="px-3 py-2 text-sm" />
                      {deal.status === 'draft' && (
                        <Link
                          href={`/intake?continue=${deal.id}`}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                        >
                          Continue
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-100">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className={`p-3 rounded-lg border ${
                    activity.actionable 
                      ? 'bg-indigo-900/20 border-indigo-500/30' 
                      : 'bg-gray-800/50 border-gray-700'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'cde_interest' ? 'bg-purple-500/20 text-purple-400' :
                        activity.type === 'investor_interest' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'message' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'match' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {activity.type === 'cde_interest' && '🏛️'}
                        {activity.type === 'investor_interest' && '💰'}
                        {activity.type === 'message' && '💬'}
                        {activity.type === 'match' && '🤝'}
                        {activity.type === 'view' && '👁️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                        {activity.dealName && (
                          <p className="text-xs text-indigo-400 mt-1">📋 {activity.dealName}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.actionable && (
                        <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}