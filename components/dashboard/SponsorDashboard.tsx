'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchDealsByOrganization } from '@/lib/supabase/queries';

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
  organizationId?: string;
}

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

export default function SponsorDashboard({ userName, orgName, organizationId }: SponsorDashboardProps) {
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      if (!organizationId) {
        setDeals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedDeals = await fetchDealsByOrganization(organizationId);
        // Map to DealSummary format
        const mappedDeals: DealSummary[] = fetchedDeals.map(d => ({
          id: d.id,
          projectName: d.projectName,
          program: d.programType as any,
          status: d.status as any,
          allocation: d.allocation,
          creditPrice: d.creditPrice,
          submittedDate: d.submittedDate,
        }));
        setDeals(mappedDeals);
      } catch (error) {
        console.error('Failed to load deals:', error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, [organizationId]);
  
  const stats = {
    totalDeals: deals.length,
    inClosing: deals.filter(d => d.status === 'closing').length,
    matched: deals.filter(d => d.status === 'matched').length,
    totalAllocation: deals.reduce((sum, d) => sum + d.allocation, 0),
    avgCreditPrice: deals.length > 0 ? deals.reduce((sum, d) => sum + d.creditPrice, 0) / deals.length : 0,
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

      {/* Stats Grid - Focus on Market Opportunity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Your Projects</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{stats.totalDeals}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">NMTC Available</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">$10B</p>
          <p className="text-xs text-emerald-300">Just awarded!</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Active CDEs</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">847</p>
          <p className="text-xs text-purple-300">With allocation</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-400">Active Investors</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">1,200+</p>
          <p className="text-xs text-blue-300">All programs</p>
        </div>
      </div>

      {/* CDE & Investor Interest */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">CDE & Investor Interest</h2>
          <Link href="/map" className="text-sm text-indigo-400 hover:text-indigo-300">Find More →</Link>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NMTC CDEs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-medium text-emerald-400">NMTC CDEs</h3>
                  <span className="text-xs text-gray-500">($10B just awarded!)</span>
                </div>
                <div className="space-y-3">
                  {/* TODO: Replace with real CDE data from Supabase */}
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">No CDE interest data available yet.</p>
                    <p className="text-xs text-gray-500 mt-1">Connect with CDEs through the Map page.</p>
                  </div>
                </div>
              </div>

              {/* Tax Credit Investors */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="font-medium text-blue-400">Active Investors</h3>
                  <span className="text-xs text-gray-500">(All programs)</span>
                </div>
                <div className="space-y-3">
                  {/* TODO: Replace with real investor data from Supabase */}
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">No investor interest data available yet.</p>
                    <p className="text-xs text-gray-500 mt-1">Connect with investors through the Map page.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
