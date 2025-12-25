'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth';
import MarketplaceFooter from '@/components/layout/MarketplaceFooter';

// =============================================================================
// TYPES (matching Supabase schema)
// =============================================================================
interface Deal {
  id: string;
  project_name: string;
  sponsor_name: string;
  sponsor_organization_id: string;
  programs: string[];
  city: string;
  state: string;
  census_tract: string;
  total_project_cost: number;
  nmtc_financing_requested: number;
  jobs_created: number;
  status: string;
  visible: boolean;
  readiness_score: number;
  tier: number;
  assigned_cde_id?: string;
  tract_eligible?: boolean;
  tract_severely_distressed?: boolean;
}

interface CDE {
  id: string;
  organization_id: string;
  organization?: { name: string; slug: string; city: string; state: string };
  remaining_allocation: number;
  min_deal_size: number;
  max_deal_size: number;
  primary_states: string[];
  service_area_type: string;
  target_sectors: string[];
  status: string;
}

interface Investor {
  id: string;
  organization_id: string;
  organization?: { name: string; slug: string };
  investor_type: string;
  target_credit_types: string[];
  min_investment: number;
  max_investment: number;
  cra_motivated: boolean;
}

const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NMTC: { bg: 'bg-emerald-900/50', text: 'text-emerald-400', border: 'border-emerald-700' },
  HTC: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-700' },
  LIHTC: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-700' },
  OZ: { bg: 'bg-amber-900/50', text: 'text-amber-400', border: 'border-amber-700' },
};

type MarketplaceView = 'deals' | 'cdes' | 'investors';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, orgType, user } = useCurrentUser();
  const organizationId = user?.organizationId;

  // Data from Supabase
  const [deals, setDeals] = useState<Deal[]>([]);
  const [cdes, setCdes] = useState<CDE[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeView, setActiveView] = useState<MarketplaceView>('deals');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  // ==========================================================================
  // FETCH DATA WITH ROLE-BASED FILTERING
  // ==========================================================================
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Build query params based on role
        const params = new URLSearchParams();
        params.set('visible', 'true');
        params.set('limit', '100');
        
        // Role-based filtering happens server-side, but we pass context
        if (orgType) params.set('viewer_role', orgType);
        if (organizationId) params.set('viewer_org', organizationId);

        // Fetch deals (CDEs and Investors see deals, Sponsors don't)
        if (orgType !== 'sponsor') {
          const dealsRes = await fetch(`/api/deals?${params}`);
          if (dealsRes.ok) {
            const data = await dealsRes.json();
            setDeals(data.deals || []);
          }
        }

        // Fetch CDEs (Sponsors and Investors see CDEs)
        if (orgType === 'sponsor' || orgType === 'investor' || !orgType) {
          const cdesRes = await fetch('/api/cdes?status=active');
          if (cdesRes.ok) {
            const data = await cdesRes.json();
            setCdes(data.cdes || []);
          }
        }

        // Fetch Investors (Sponsors and CDEs see Investors)
        if (orgType === 'sponsor' || orgType === 'cde' || !orgType) {
          const invRes = await fetch('/api/investors?limit=50');
          if (invRes.ok) {
            const data = await invRes.json();
            setInvestors(data.investors || []);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, isLoading, orgType, organizationId]);

  // Set default view based on role
  useEffect(() => {
    if (orgType === 'sponsor') setActiveView('cdes');
    else if (orgType === 'cde') setActiveView('deals');
    else if (orgType === 'investor') setActiveView('deals');
  }, [orgType]);

  // ==========================================================================
  // WHAT EACH ROLE SEES
  // ==========================================================================
  const getViewTabs = () => {
    switch (orgType) {
      case 'sponsor':
        return [
          { id: 'cdes' as const, label: 'Find CDEs', sublabel: 'NMTC Allocation', count: cdes.length },
          { id: 'investors' as const, label: 'Find Investors', count: investors.length },
        ];
      case 'cde':
        return [
          { id: 'deals' as const, label: 'Browse Projects', count: deals.length },
          { id: 'investors' as const, label: 'Find Investors', count: investors.length },
        ];
      case 'investor':
      default:
        return [
          { id: 'deals' as const, label: 'Browse Projects', count: deals.length },
          { id: 'cdes' as const, label: 'Browse CDEs', count: cdes.length },
        ];
    }
  };

  // ==========================================================================
  // FILTERED DATA
  // ==========================================================================
  const filteredDeals = useMemo(() => {
    let result = deals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.project_name?.toLowerCase().includes(q) ||
        d.sponsor_name?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') result = result.filter(d => d.state === stateFilter);
    if (programFilter !== 'all') result = result.filter(d => d.programs?.includes(programFilter));
    return result;
  }, [deals, searchQuery, stateFilter, programFilter]);

  const filteredCDEs = useMemo(() => {
    let result = cdes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.organization?.name?.toLowerCase().includes(q));
    }
    if (stateFilter !== 'all') result = result.filter(c => c.primary_states?.includes(stateFilter));
    return result;
  }, [cdes, searchQuery, stateFilter]);

  const filteredInvestors = useMemo(() => {
    let result = investors;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.organization?.name?.toLowerCase().includes(q));
    }
    if (programFilter !== 'all') result = result.filter(i => i.target_credit_types?.includes(programFilter));
    return result;
  }, [investors, searchQuery, programFilter]);

  const allStates = useMemo(() => {
    const states = new Set<string>();
    deals.forEach(d => d.state && states.add(d.state));
    cdes.forEach(c => c.primary_states?.forEach(s => states.add(s)));
    return [...states].sort();
  }, [deals, cdes]);

  // ==========================================================================
  // AUTH REDIRECT
  // ==========================================================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin?redirect=/deals');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const viewTabs = getViewTabs();


  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Marketplace</h1>
              <p className="text-gray-400 text-sm mt-1">
                {orgType === 'sponsor' && 'Find CDEs and Investors for your projects'}
                {orgType === 'cde' && 'Browse projects seeking allocation'}
                {orgType === 'investor' && 'Discover investment opportunities'}
                {!orgType && 'Full marketplace view'}
              </p>
            </div>
            
            {/* SUBMIT BUTTON - SPONSORS ONLY */}
            {orgType === 'sponsor' && (
              <Link
                href="/intake"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
              >
                + Submit Project
              </Link>
            )}
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            {viewTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-0.5 bg-black/20 rounded text-sm">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none w-64"
            />
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All States</option>
              {allStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(activeView === 'deals' || activeView === 'investors') && (
              <select
                value={programFilter}
                onChange={e => setProgramFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Programs</option>
                <option value="NMTC">NMTC</option>
                <option value="HTC">HTC</option>
                <option value="LIHTC">LIHTC</option>
                <option value="OZ">Opportunity Zone</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-indigo-400 hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeView === 'deals' && filteredDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
            {activeView === 'cdes' && filteredCDEs.map(cde => (
              <CDECard key={cde.id} cde={cde} />
            ))}
            {activeView === 'investors' && filteredInvestors.map(inv => (
              <InvestorCard key={inv.id} investor={inv} />
            ))}
            
            {/* Empty state */}
            {activeView === 'deals' && filteredDeals.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No projects found</p>
              </div>
            )}
            {activeView === 'cdes' && filteredCDEs.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No CDEs found</p>
              </div>
            )}
            {activeView === 'investors' && filteredInvestors.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No investors found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
}

// =============================================================================
// CARD COMPONENTS
// =============================================================================
function DealCard({ deal }: { deal: Deal }) {
  const program = deal.programs?.[0] || 'NMTC';
  const colors = PROGRAM_COLORS[program] || PROGRAM_COLORS.NMTC;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-emerald-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
            {program}
          </span>
          <h3 className="font-semibold text-white text-lg mt-2">{deal.project_name}</h3>
          <p className="text-sm text-gray-500">{deal.sponsor_name}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-4">{deal.city}, {deal.state}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Financing</p>
          <p className="text-lg font-bold text-white">${((deal.nmtc_financing_requested || deal.total_project_cost) / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Jobs</p>
          <p className="text-lg font-bold text-green-400">{deal.jobs_created || 0}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500">Tier {deal.tier}</span>
        <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );
}

function CDECard({ cde }: { cde: CDE }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all p-5">
      <h3 className="font-semibold text-white text-lg">{cde.organization?.name || 'CDE'}</h3>
      <p className="text-sm text-gray-500 mb-4">{cde.organization?.city}, {cde.organization?.state}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-green-400">${(cde.remaining_allocation / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Deal Range</p>
          <p className="text-sm font-medium text-white">${(cde.min_deal_size / 1000000).toFixed(0)}-${(cde.max_deal_size / 1000000).toFixed(0)}M</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {cde.primary_states?.slice(0, 5).map(s => (
          <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500">{cde.service_area_type}</span>
        <Link href={`/cde/${cde.organization?.slug || cde.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );
}

function InvestorCard({ investor }: { investor: Investor }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all p-5">
      <h3 className="font-semibold text-white text-lg">{investor.organization?.name || 'Investor'}</h3>
      <p className="text-sm text-gray-500 mb-4">{investor.investor_type}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Investment</p>
          <p className="text-sm font-medium text-white">${(investor.min_investment / 1000000).toFixed(0)}-${(investor.max_investment / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">CRA</p>
          <p className="text-sm font-medium text-white">{investor.cra_motivated ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {investor.target_credit_types?.map(t => (
          <span key={t} className={`px-2 py-0.5 text-xs rounded ${
            t === 'NMTC' ? 'bg-emerald-900/30 text-emerald-300' :
            t === 'HTC' ? 'bg-blue-900/30 text-blue-300' :
            'bg-purple-900/30 text-purple-300'
          }`}>{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500">Active</span>
        <Link href={`/investor/${investor.organization?.slug || investor.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );

}
