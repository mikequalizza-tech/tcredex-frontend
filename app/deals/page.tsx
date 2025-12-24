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
  programs: string[];
  program_level: string;
  city: string;
  state: string;
  census_tract: string;
  total_project_cost: number;
  nmtc_financing_requested: number;
  jobs_created: number;
  status: string;
  phase?: string;
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
  organization?: {
    name: string;
    slug: string;
    city: string;
    state: string;
  };
  remaining_allocation: number;
  total_allocation: number;
  min_deal_size: number;
  max_deal_size: number;
  primary_states: string[];
  service_area_type: string;
  target_sectors: string[];
  impact_priorities: string[];
  status: string;
  primary_contact_name: string;
  primary_contact_email: string;
}

interface Investor {
  id: string;
  organization_id: string;
  organization?: {
    name: string;
    slug: string;
  };
  investor_type: string;
  target_credit_types: string[];
  min_investment: number;
  max_investment: number;
  target_states?: string[];
  cra_motivated: boolean;
  primary_contact_name: string;
  primary_contact_email: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================
const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NMTC: { bg: 'bg-emerald-900/50', text: 'text-emerald-400', border: 'border-emerald-700' },
  HTC: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-700' },
  LIHTC: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-700' },
  OZ: { bg: 'bg-amber-900/50', text: 'text-amber-400', border: 'border-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-900/50 text-green-400' },
  under_review: { label: 'Under Review', color: 'bg-amber-900/50 text-amber-400' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-400' },
  draft: { label: 'Draft', color: 'bg-gray-700 text-gray-400' },
  closed: { label: 'Closed', color: 'bg-gray-700 text-gray-400' },
};

type MarketplaceView = 'projects' | 'cdes' | 'investors';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, orgType, user } = useCurrentUser();

  // Data state - fetched from Supabase via API
  const [deals, setDeals] = useState<Deal[]>([]);
  const [cdes, setCdes] = useState<CDE[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeView, setActiveView] = useState<MarketplaceView>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ==========================================================================
  // FETCH REAL DATA FROM SUPABASE
  // ==========================================================================
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch deals
        const dealsRes = await fetch('/api/deals?visible=true&limit=100');
        if (!dealsRes.ok) throw new Error('Failed to fetch deals');
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);

        // Fetch CDEs
        const cdesRes = await fetch('/api/cdes?status=active&limit=50');
        if (!cdesRes.ok) throw new Error('Failed to fetch CDEs');
        const cdesData = await cdesRes.json();
        setCdes(cdesData.cdes || []);

        // Fetch Investors (create API if needed)
        try {
          const investorsRes = await fetch('/api/investors?limit=50');
          if (investorsRes.ok) {
            const investorsData = await investorsRes.json();
            setInvestors(investorsData.investors || []);
          }
        } catch {
          // Investors API may not exist yet
          console.log('Investors API not available');
        }

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Set default view based on role
  useEffect(() => {
    if (orgType === 'sponsor') {
      setActiveView('investors');
    } else {
      setActiveView('projects');
    }
  }, [orgType]);

  // ==========================================================================
  // FILTERED DATA
  // ==========================================================================
  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => d.visible);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.project_name?.toLowerCase().includes(q) ||
        d.sponsor_name?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(d => d.state === stateFilter);
    }
    if (programFilter !== 'all') {
      result = result.filter(d => d.programs?.includes(programFilter));
    }
    return result;
  }, [deals, searchQuery, stateFilter, programFilter]);

  const filteredCDEs = useMemo(() => {
    let result = cdes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.organization?.name?.toLowerCase().includes(q) ||
        c.target_sectors?.some(s => s.toLowerCase().includes(q))
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(c => c.primary_states?.includes(stateFilter));
    }
    return result;
  }, [cdes, searchQuery, stateFilter]);

  const filteredInvestors = useMemo(() => {
    let result = investors;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.organization?.name?.toLowerCase().includes(q) ||
        i.investor_type?.toLowerCase().includes(q)
      );
    }
    if (programFilter !== 'all') {
      result = result.filter(i => i.target_credit_types?.includes(programFilter));
    }
    return result;
  }, [investors, searchQuery, programFilter]);

  // Unique states for filter
  const allStates = useMemo(() => {
    const states = new Set<string>();
    deals.forEach(d => d.state && states.add(d.state));
    cdes.forEach(c => c.primary_states?.forEach(s => states.add(s)));
    return [...states].sort();
  }, [deals, cdes]);

  // ==========================================================================
  // AUTH CHECK
  // ==========================================================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin?redirect=/deals');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW OPTIONS
  // ==========================================================================
  type ViewOption = { id: MarketplaceView; label: string; count: number; sublabel?: string };
  
  const getViewOptions = (): ViewOption[] => {
    if (orgType === 'sponsor') {
      return [
        { id: 'investors', label: 'Find Investors', count: investors.length },
        { id: 'cdes', label: 'Find CDEs', sublabel: 'NMTC only', count: cdes.length },
      ];
    }
    if (orgType === 'cde') {
      return [
        { id: 'projects', label: 'Browse Projects', count: filteredDeals.length },
        { id: 'investors', label: 'Find Investors', count: investors.length },
      ];
    }
    // Investor or admin
    return [
      { id: 'projects', label: 'Browse Projects', count: filteredDeals.length },
      { id: 'cdes', label: 'Browse CDEs', count: cdes.length },
    ];
  };

  const viewOptions = getViewOptions();


  // ==========================================================================
  // CARD COMPONENTS
  // ==========================================================================

  const DealCard = ({ deal }: { deal: Deal }) => {
    const program = deal.programs?.[0] || 'NMTC';
    const colors = PROGRAM_COLORS[program] || PROGRAM_COLORS.NMTC;
    const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.available;

    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-emerald-500/50 transition-all p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mb-2 ${colors.bg} ${colors.text} ${colors.border}`}>
              {program}
            </span>
            <h3 className="font-semibold text-white text-lg">{deal.project_name}</h3>
            <p className="text-sm text-gray-500">{deal.sponsor_name}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="text-sm text-gray-400 mb-4">{deal.city}, {deal.state}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Financing</p>
            <p className="text-lg font-bold text-white">
              ${((deal.nmtc_financing_requested || deal.total_project_cost) / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Jobs</p>
            <p className="text-lg font-bold text-green-400">{deal.jobs_created || 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {deal.tract_severely_distressed && (
            <span className="px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded">Severely Distressed</span>
          )}
          {deal.tract_eligible && (
            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">NMTC Eligible</span>
          )}
          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">Tier {deal.tier}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            Score: <span className="text-gray-400">{deal.readiness_score}</span>
          </div>
          <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            View Details →
          </Link>
        </div>
      </div>
    );
  };

  const CDECard = ({ cde }: { cde: CDE }) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{cde.organization?.name || 'CDE'}</h3>
          <p className="text-sm text-gray-500">{cde.organization?.city}, {cde.organization?.state}</p>
        </div>
        <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded-full">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-green-400">${(cde.remaining_allocation / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Deal Range</p>
          <p className="text-sm font-medium text-white">
            ${(cde.min_deal_size / 1000000).toFixed(0)}-${(cde.max_deal_size / 1000000).toFixed(0)}M
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {cde.target_sectors?.slice(0, 3).map(s => (
          <span key={s} className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-xs rounded">{s}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {cde.primary_states?.slice(0, 5).map(s => (
          <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{s}</span>
        ))}
        {(cde.primary_states?.length || 0) > 5 && (
          <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">
            +{(cde.primary_states?.length || 0) - 5}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">{cde.service_area_type}</div>
        <Link href={`/cde/${cde.organization?.slug || cde.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );

  const InvestorCard = ({ investor }: { investor: Investor }) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{investor.organization?.name || 'Investor'}</h3>
          <p className="text-sm text-gray-500">{investor.investor_type}</p>
        </div>
        <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs font-medium rounded-full">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Investment Range</p>
          <p className="text-sm font-medium text-white">
            ${(investor.min_investment / 1000000).toFixed(0)}-${(investor.max_investment / 1000000).toFixed(0)}M
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">CRA Motivated</p>
          <p className="text-sm font-medium text-white">{investor.cra_motivated ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {investor.target_credit_types?.map(t => (
          <span key={t} className={`px-2 py-0.5 text-xs rounded ${
            t === 'NMTC' ? 'bg-emerald-900/30 text-emerald-300' :
            t === 'HTC' ? 'bg-blue-900/30 text-blue-300' :
            t === 'LIHTC' ? 'bg-purple-900/30 text-purple-300' :
            'bg-amber-900/30 text-amber-300'
          }`}>{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">{investor.primary_contact_name}</div>
        <Link href={`/investor/${investor.organization?.slug || investor.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );


  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} min-h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Marketplace</h2>
                  <p className="text-xs text-gray-500 capitalize">{orgType} View</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                </svg>
              </button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* View Options */}
              <div className="p-4 space-y-2">
                {viewOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveView(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeView === opt.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{opt.label}</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        activeView === opt.id ? 'bg-indigo-500' : 'bg-gray-700'
                      }`}>
                        {opt.count}
                      </span>
                    </div>
                    {opt.sublabel && (
                      <span className="text-xs opacity-75">{opt.sublabel}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className="p-4 border-t border-gray-800 space-y-2">
                <Link href="/submit" className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Submit Project</span>
                </Link>
                <Link href="/map" className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Eligibility Map</span>
                </Link>
              </div>

              {/* Data Status */}
              <div className="mt-auto p-4 border-t border-gray-800">
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between mb-1">
                    <span>Projects:</span>
                    <span className="text-gray-400">{deals.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>CDEs:</span>
                    <span className="text-gray-400">{cdes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investors:</span>
                    <span className="text-gray-400">{investors.length}</span>
                  </div>
                </div>
                {error && (
                  <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header + Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">
                {activeView === 'projects' ? 'Browse Projects' :
                 activeView === 'cdes' ? 'Community Development Entities' :
                 'Tax Credit Investors'}
              </h1>
              <div className="text-sm text-gray-400">
                {activeView === 'projects' && `${filteredDeals.length} projects`}
                {activeView === 'cdes' && `${filteredCDEs.length} CDEs`}
                {activeView === 'investors' && `${filteredInvestors.length} investors`}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-64"
              />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All States</option>
                {allStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(activeView === 'projects' || activeView === 'investors') && (
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
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

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading from database...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && activeView === 'projects' && filteredDeals.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your filters or submit a new project.</p>
              <Link href="/submit" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                Submit Project
              </Link>
            </div>
          )}

          {/* Results Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeView === 'projects' && filteredDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
              {activeView === 'cdes' && filteredCDEs.map(cde => (
                <CDECard key={cde.id} cde={cde} />
              ))}
              {activeView === 'investors' && filteredInvestors.map(inv => (
                <InvestorCard key={inv.id} investor={inv} />
              ))}
            </div>
          )}
        </main>
      </div>
      <MarketplaceFooter />
    </div>
  );
}
