'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MarketplaceFooter from '@/components/layout/MarketplaceFooter';
import { fetchMarketplaceDeals } from '@/lib/supabase/queries';

// Types - Unified with lib/db/types.ts
type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
type ProgramLevel = 'federal' | 'state';
type DealStatus = 'draft' | 'submitted' | 'under_review' | 'available' | 'seeking_capital' | 'matched' | 'closing' | 'closed' | 'withdrawn';
type TractType = 'QCT' | 'SD' | 'LIC' | 'DDA';
type EntityView = 'investors' | 'cdes' | 'deals' | 'sponsors';

interface MarketplaceDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  sponsorLogo?: string;
  website?: string;
  programType: ProgramType;
  programLevel: ProgramLevel;
  stateProgram?: string;
  allocation: number;
  creditPrice: number;
  state: string;
  city: string;
  tractType: TractType[];
  status: DealStatus;
  foundedYear?: number;
  submittedDate: string;
  povertyRate?: number;
  medianIncome?: number;
  visible: boolean;
}

// Constants - Dark Theme Colors
const PROGRAM_COLORS: Record<ProgramType, string> = {
  NMTC: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  HTC: 'bg-blue-900/50 text-blue-400 border-blue-700',
  LIHTC: 'bg-purple-900/50 text-purple-400 border-purple-700',
  OZ: 'bg-amber-900/50 text-amber-400 border-amber-700',
};

const LEVEL_COLORS: Record<ProgramLevel, string> = {
  federal: 'bg-gray-800 text-gray-300',
  state: 'bg-sky-900/50 text-sky-400',
};

const STATUS_COLORS: Record<DealStatus, string> = {
  draft: 'bg-gray-700 text-gray-400',
  submitted: 'bg-blue-900/50 text-blue-400',
  under_review: 'bg-amber-900/50 text-amber-400',
  available: 'bg-green-900/50 text-green-400',
  seeking_capital: 'bg-indigo-900/50 text-indigo-400',
  matched: 'bg-purple-900/50 text-purple-400',
  closing: 'bg-teal-900/50 text-teal-400',
  closed: 'bg-emerald-900/50 text-emerald-400',
  withdrawn: 'bg-gray-800 text-gray-400',
};

const STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  available: 'Available',
  seeking_capital: 'Seeking Capital',
  matched: 'Matched',
  closing: 'Closing',
  closed: 'Closed',
  withdrawn: 'Withdrawn',
};

const TRACT_LABELS: Record<TractType, string> = {
  QCT: 'Qualified Census Tract',
  SD: 'Severely Distressed',
  LIC: 'Low-Income Community',
  DDA: 'Difficult Development Area',
};

const US_STATES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

type SortField = 'projectName' | 'sponsorName' | 'programType' | 'allocation' | 'creditPrice' | 'state' | 'status' | 'submittedDate';
type SortDirection = 'asc' | 'desc';

export default function MarketplacePage() {
  const [deals, setDeals] = useState<MarketplaceDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      try {
        const fetchedDeals = await fetchMarketplaceDeals();
        setDeals(fetchedDeals);
      } catch (error) {
        console.error('Failed to load deals:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('submittedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<ProgramType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ProgramLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState<EntityView>('deals');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const itemsPerPage = 50;

  const uniqueStates = useMemo(() => [...new Set(deals.map(d => d.state))].sort(), [deals]);

  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => d.visible);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => d.projectName.toLowerCase().includes(query) || d.sponsorName.toLowerCase().includes(query) || d.city.toLowerCase().includes(query) || d.state.toLowerCase().includes(query));
    }
    if (programFilter !== 'all') result = result.filter(d => d.programType === programFilter);
    if (levelFilter !== 'all') result = result.filter(d => d.programLevel === levelFilter);
    if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter);
    if (stateFilter !== 'all') result = result.filter(d => d.state === stateFilter);
    result.sort((a, b) => {
      let aVal: string | number = a[sortField] as string | number;
      let bVal: string | number = b[sortField] as string | number;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [deals, searchQuery, programFilter, levelFilter, statusFilter, stateFilter, sortField, sortDirection]);

  // IMPORTANT: All hooks must be called before any early returns
  // This useMemo must be before the loading check to satisfy React's rules of hooks
  const programStats = useMemo(() => {
    return {
      nmtc: deals.filter(d => d.programType === 'NMTC').length,
      htc: deals.filter(d => d.programType === 'HTC').length,
      lihtc: deals.filter(d => d.programType === 'LIHTC').length,
      oz: deals.filter(d => d.programType === 'OZ').length,
      federal: deals.filter(d => d.programLevel === 'federal').length,
      state: deals.filter(d => d.programLevel === 'state').length,
    };
  }, [deals]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Marketplace...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const paginatedDeals = filteredDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === paginatedDeals.length) setSelectedDeals(new Set());
    else setSelectedDeals(new Set(paginatedDeals.map(d => d.id)));
  };

  const handleSelectDeal = (id: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedDeals(newSelected);
  };

  const clearFilter = (filter: 'program' | 'level' | 'status' | 'state') => {
    if (filter === 'program') setProgramFilter('all');
    if (filter === 'level') setLevelFilter('all');
    if (filter === 'status') setStatusFilter('all');
    if (filter === 'state') setStateFilter('all');
  };

  const activeFilters = [
    programFilter !== 'all' && { type: 'program', label: programFilter, value: programFilter },
    levelFilter !== 'all' && { type: 'level', label: levelFilter === 'federal' ? 'Federal' : 'State', value: levelFilter },
    statusFilter !== 'all' && { type: 'status', label: STATUS_LABELS[statusFilter], value: statusFilter },
    stateFilter !== 'all' && { type: 'state', label: stateFilter, value: stateFilter },
  ].filter(Boolean) as { type: string; label: string; value: string }[];

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg className={`w-4 h-4 ml-1 inline-block ${sortField === field ? 'text-indigo-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {sortField === field && sortDirection === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : sortField === field && sortDirection === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      )}
    </svg>
  );

  const sidebarItems = [
    { id: 'investors', label: 'Investors', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', count: 156 },
    { id: 'cdes', label: 'CDEs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', count: 42 },
    { id: 'deals', label: 'Projects', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', count: deals.length },
    { id: 'sponsors', label: 'Sponsors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', count: 89 },
  ];

  const viewTitles: Record<EntityView, string> = { investors: 'Investors', cdes: 'CDEs', deals: 'Marketplace Projects', sponsors: 'Sponsors' };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Sidebar */}
      <aside className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">tC</span>
            </div>
            {!sidebarCollapsed && (
              <>
                <span className="font-semibold text-gray-100">tCredex</span>
                <span className="text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
              </>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id as EntityView)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              title={sidebarCollapsed ? item.label : undefined}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeView === item.id ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500'}`}>{item.count}</span>
                </>
              )}
            </button>
          ))}

          {activeView === 'deals' && !sidebarCollapsed && (
            <div className="pt-4 mt-4 border-t border-gray-800">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">By Program</div>
              <div className="space-y-1">
                {(['NMTC', 'HTC', 'LIHTC', 'OZ'] as ProgramType[]).map(prog => (
                  <button key={prog} onClick={() => setProgramFilter(programFilter === prog ? 'all' : prog)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-sm ${programFilter === prog ? 'bg-indigo-900/50 text-indigo-300' : 'text-gray-400 hover:bg-gray-800'}`}>
                    <span>{prog}</span>
                    <span className="text-xs">{programStats[prog.toLowerCase() as keyof typeof programStats]}</span>
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 mt-3 text-xs font-medium text-gray-500 uppercase">By Level</div>
              <div className="space-y-1">
                <button onClick={() => setLevelFilter(levelFilter === 'federal' ? 'all' : 'federal')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-sm ${levelFilter === 'federal' ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:bg-gray-800'}`}>
                  <span>Federal</span><span className="text-xs">{programStats.federal}</span>
                </button>
                <button onClick={() => setLevelFilter(levelFilter === 'state' ? 'all' : 'state')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-sm ${levelFilter === 'state' ? 'bg-sky-900/50 text-sky-300' : 'text-gray-400 hover:bg-gray-800'}`}>
                  <span>State</span><span className="text-xs">{programStats.state}</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
            </svg>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-100">{viewTitles[activeView]}</h1>
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-2">
                  {activeFilters.map(filter => (
                    <span key={filter.type} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-medium">
                      {filter.label}
                      <button onClick={() => clearFilter(filter.type as 'program' | 'level' | 'status' | 'state')} className="hover:bg-indigo-800 rounded-full p-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects, sponsors, cities..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DealStatus | 'all')}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="under_review">Under Review</option>
                <option value="matched">Matched</option>
                <option value="closing">Closing</option>
              </select>

              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                <option value="all">All States</option>
                {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
              </select>

              <Link href="/deals/new" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Submit Project
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={selectedDeals.size === paginatedDeals.length && paginatedDeals.length > 0} onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('projectName')}>
                      Project / Sponsor<SortIcon field="projectName" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('programType')}>
                      Program<SortIcon field="programType" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('allocation')}>
                      Allocation<SortIcon field="allocation" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('creditPrice')}>
                      Credit Price<SortIcon field="creditPrice" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('state')}>
                      State<SortIcon field="state" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tract</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('status')}>
                      Status<SortIcon field="status" />
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedDeals.map(deal => (
                    <tr key={deal.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedDeals.has(deal.id)} onChange={() => handleSelectDeal(deal.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                            {deal.sponsorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <Link href={`/deals/${deal.id}`} className="font-medium text-gray-100 hover:text-indigo-400">{deal.projectName}</Link>
                            <div className="text-sm text-gray-500">{deal.sponsorName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${PROGRAM_COLORS[deal.programType]}`}>{deal.programType}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs ${LEVEL_COLORS[deal.programLevel]}`}>{deal.programLevel === 'federal' ? 'Federal' : deal.stateProgram || 'State'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="font-medium text-gray-100">${(deal.allocation / 1000000).toFixed(1)}M</span></td>
                      <td className="px-4 py-3"><span className="font-medium text-gray-100">${deal.creditPrice.toFixed(2)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-6 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">{US_STATES[deal.state] || deal.state.slice(0, 2).toUpperCase()}</span>
                          <span className="text-sm text-gray-300">{deal.state}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {deal.tractType.map(tract => (
                            <span key={tract} className={`px-1.5 py-0.5 rounded text-xs ${tract === 'SD' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`} title={TRACT_LABELS[tract]}>{tract}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status]}`}>{STATUS_LABELS[deal.status]}</span></td>
                      <td className="px-4 py-3"><Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDeals.length)} of {filteredDeals.length} projects</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">→</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
