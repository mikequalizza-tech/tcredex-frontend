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
  organization?: { name: string; slug: string; city: string; state: string };
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
  primary_contact_name: string;
}

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
// CARD COMPONENTS
// =============================================================================
function DealCard({ deal }: { deal: Deal }) {
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
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
      <div className="flex flex-wrap gap-1 mb-4">
        {deal.tract_severely_distressed && <span className="px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded">Severely Distressed</span>}
        {deal.tract_eligible && <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">NMTC Eligible</span>}
        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">Tier {deal.tier}</span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">Score: <span className="text-gray-400">{deal.readiness_score}</span></div>
        <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Details →</Link>
      </div>
    </div>
  );
}

function CDECard({ cde }: { cde: CDE }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{cde.organization?.name || 'CDE'}</h3>
          <p className="text-sm text-gray-500">{cde.organization?.city}, {cde.organization?.state}</p>
        </div>
        <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded-full">Active</span>
      </div>
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
        {cde.target_sectors?.slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-xs rounded">{s}</span>)}
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {cde.primary_states?.slice(0, 5).map(s => <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{s}</span>)}
        {(cde.primary_states?.length || 0) > 5 && <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">+{(cde.primary_states?.length || 0) - 5}</span>}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">{cde.service_area_type}</div>
        <Link href={`/cde/${cde.organization?.slug || cde.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Details →</Link>
      </div>
    </div>
  );
}

function InvestorCard({ investor }: { investor: Investor }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{investor.organization?.name || 'Investor'}</h3>
          <p className="text-sm text-gray-500">{investor.investor_type}</p>
        </div>
        <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs font-medium rounded-full">Active</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Investment Range</p>
          <p className="text-sm font-medium text-white">${(investor.min_investment / 1000000).toFixed(0)}-${(investor.max_investment / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">CRA Motivated</p>
          <p className="text-sm font-medium text-white">{investor.cra_motivated ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {investor.target_credit_types?.map(t => (
          <span key={t} className={`px-2 py-0.5 text-xs rounded ${t === 'NMTC' ? 'bg-emerald-900/30 text-emerald-300' : t === 'HTC' ? 'bg-blue-900/30 text-blue-300' : t === 'LIHTC' ? 'bg-purple-900/30 text-purple-300' : 'bg-amber-900/30 text-amber-300'}`}>{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">{investor.primary_contact_name}</div>
        <Link href={`/investor/${investor.organization?.slug || investor.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Details →</Link>
      </div>
    </div>
  );
}


// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, orgType, user } = useCurrentUser();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [cdes, setCdes] = useState<CDE[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<MarketplaceView>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [dealsRes, cdesRes, investorsRes] = await Promise.all([
          fetch('/api/deals?visible=true&limit=100'),
          fetch('/api/cdes?status=active&limit=50'),
          fetch('/api/investors?limit=50'),
        ]);
        
        if (dealsRes.ok) {
          const d = await dealsRes.json();
          setDeals(d.deals || []);
        }
        if (cdesRes.ok) {
          const c = await cdesRes.json();
          setCdes(c.cdes || []);
        }
        if (investorsRes.ok) {
          const i = await investorsRes.json();
          setInvestors(i.investors || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (orgType === 'sponsor') setActiveView('investors');
    else setActiveView('projects');
  }, [orgType]);

  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => d.visible);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.project_name?.toLowerCase().includes(q) || d.sponsor_name?.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q));
    }
    if (stateFilter !== 'all') result = result.filter(d => d.state === stateFilter);
    if (programFilter !== 'all') result = result.filter(d => d.programs?.includes(programFilter));
    return result;
  }, [deals, searchQuery, stateFilter, programFilter]);

  const filteredCDEs = useMemo(() => {
    let result = cdes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.organization?.name?.toLowerCase().includes(q) || c.target_sectors?.some(s => s.toLowerCase().includes(q)));
    }
    if (stateFilter !== 'all') result = result.filter(c => c.primary_states?.includes(stateFilter));
    return result;
  }, [cdes, searchQuery, stateFilter]);

  const filteredInvestors = useMemo(() => {
    let result = investors;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.organization?.name?.toLowerCase().includes(q) || i.investor_type?.toLowerCase().includes(q));
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/signin?redirect=/deals');
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

  const getViewOptions = (): Array<{ id: MarketplaceView; label: string; count: number; sublabel?: string }> => {
    if (orgType === 'sponsor') return [
      { id: 'investors', label: 'Find Investors', count: investors.length },
      { id: 'cdes', label: 'Find CDEs', sublabel: 'NMTC only', count: cdes.length },
    ];
    if (orgType === 'cde') return [
      { id: 'projects', label: 'Browse Projects', count: filteredDeals.length },
      { id: 'investors', label: 'Find Investors', count: investors.length },
    ];
    return [
      { id: 'projects', label: 'Browse Projects', count: filteredDeals.length },
      { id: 'cdes', label: 'Browse CDEs', count: cdes.length },
    ];
  };
  const viewOptions = getViewOptions();


  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Marketplace</h1>
              <p className="text-sm text-gray-400">
                {orgType === 'sponsor' ? 'Find financing partners for your projects' : orgType === 'cde' ? 'Discover projects seeking allocation' : 'Browse investment opportunities'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/map" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">Map View</Link>
              {orgType === 'sponsor' && <Link href="/intake" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">Submit Project</Link>}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-gray-900 border-r border-gray-800 min-h-[calc(100vh-73px)] transition-all duration-300`}>
          <div className="p-4">
            {!sidebarCollapsed && (
              <>
                <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Viewing as</p>
                  <p className="text-sm font-medium text-white capitalize">{orgType || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="space-y-2 mb-6">
                  {viewOptions.map(opt => (
                    <button key={opt.id} onClick={() => setActiveView(opt.id)} className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeView === opt.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{opt.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeView === opt.id ? 'bg-white/20' : 'bg-gray-700'}`}>{opt.count}</span>
                      </div>
                      {opt.sublabel && <p className="text-xs mt-0.5 opacity-70">{opt.sublabel}</p>}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Search</label>
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">State</label>
                    <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-indigo-500">
                      <option value="all">All States</option>
                      {allStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {activeView !== 'cdes' && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Program</label>
                      <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-indigo-500">
                        <option value="all">All Programs</option>
                        <option value="NMTC">NMTC</option>
                        <option value="HTC">HTC</option>
                        <option value="LIHTC">LIHTC</option>
                        <option value="OZ">OZ</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="mt-4 w-full p-2 text-gray-500 hover:text-gray-400 text-center">{sidebarCollapsed ? '→' : '←'}</button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading from database...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
              <p className="text-red-400 font-medium mb-2">Error loading data</p>
              <p className="text-red-300/70 text-sm">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">Retry</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  {activeView === 'projects' && `${filteredDeals.length} Projects`}
                  {activeView === 'cdes' && `${filteredCDEs.length} CDEs`}
                  {activeView === 'investors' && `${filteredInvestors.length} Investors`}
                </h2>
                <p className="text-sm text-green-500">● Live from Supabase</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activeView === 'projects' && filteredDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                {activeView === 'cdes' && filteredCDEs.map(cde => <CDECard key={cde.id} cde={cde} />)}
                {activeView === 'investors' && filteredInvestors.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
              </div>
              {((activeView === 'projects' && filteredDeals.length === 0) || (activeView === 'cdes' && filteredCDEs.length === 0) || (activeView === 'investors' && filteredInvestors.length === 0)) && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
                  <p className="text-gray-400 text-sm mb-4">Try adjusting your filters</p>
                  <button onClick={() => { setSearchQuery(''); setStateFilter('all'); setProgramFilter('all'); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">Clear Filters</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <MarketplaceFooter />
    </div>
  );
}
