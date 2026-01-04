'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MarketplaceFooter from '@/components/layout/MarketplaceFooter';
import Logo from '@/components/ui/logo';
import MapFilterRail, { FilterState, defaultFilters } from '@/components/maps/MapFilterRail';
import { useRoleConfig, fetchMarketplaceForRole, MarketplaceResult, InvestorCard } from '@/lib/roles';
import { Deal } from '@/lib/data/deals';
import { CDEDealCard } from '@/lib/types/cde';

// Types
type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
type ProgramLevel = 'federal' | 'state';
type DealStatus = 'draft' | 'submitted' | 'under_review' | 'available' | 'seeking_capital' | 'matched' | 'closing' | 'closed' | 'withdrawn';
type TractType = 'QCT' | 'SD' | 'LIC' | 'DDA';
type EntityView = 'investors' | 'cdes' | 'deals' | 'sponsors';

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

type SortField = 'projectName' | 'sponsorName' | 'programType' | 'allocation' | 'creditPrice' | 'state' | 'status' | 'submittedDate' | 'organizationName' | 'remainingAllocation';
type SortDirection = 'asc' | 'desc';

export default function MarketplacePage() {
  // Get role configuration
  const { orgType, orgId, marketplace, isLoading: authLoading } = useRoleConfig();

  // Data state
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceResult>({ deals: [], cdes: [], investors: [] });
  const [loading, setLoading] = useState(true);

  // Determine default view based on role
  const getDefaultView = (): EntityView => {
    if (orgType === 'sponsor') return 'cdes'; // Sponsors see CDEs first
    return 'deals'; // CDEs and Investors see deals
  };

  // UI state
  const [activeView, setActiveView] = useState<EntityView>(getDefaultView());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('submittedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<ProgramType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ProgramLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const itemsPerPage = 50;

  // MapFilterRail state
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);

  // Get view mode for MapFilterRail based on orgType
  const getViewMode = (): 'sponsor' | 'cde' | 'investor' => {
    if (orgType === 'sponsor') return 'sponsor';
    if (orgType === 'cde') return 'cde';
    return 'investor';
  };

  // Fetch data based on role
  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      setLoading(true);
      try {
        const data = await fetchMarketplaceForRole(orgType, orgId);
        setMarketplaceData(data);
        // Update default view based on what data we received
        if (orgType === 'sponsor' && data.cdes.length > 0) {
          setActiveView('cdes');
        } else if (data.deals.length > 0) {
          setActiveView('deals');
        }
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgType, orgId, authLoading]);

  // Extract deals, CDEs, and investors from marketplace data
  const { deals, cdes, investors } = marketplaceData;

  // Filter and sort deals using MapFilterRail filters
  const filteredDeals = useMemo(() => {
    let result = deals.filter(d => d.visible !== false);

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.projectName.toLowerCase().includes(query) ||
        d.sponsorName.toLowerCase().includes(query) ||
        d.city?.toLowerCase().includes(query) ||
        d.state?.toLowerCase().includes(query)
      );
    }

    // Credit type filter from MapFilterRail
    if (filters.creditTypes.length > 0) {
      result = result.filter(d => {
        const dealProgram = d.programType.toLowerCase();
        return filters.creditTypes.some(ct => ct.toLowerCase() === dealProgram);
      });
    }

    // State credits filter
    if (filters.includeStateCredits) {
      // Include state-level programs
    } else {
      // Only federal by default
      if (levelFilter !== 'all') result = result.filter(d => d.programLevel === levelFilter);
    }

    // Deal status filters from MapFilterRail
    if (filters.shovelReadyOnly) {
      result = result.filter(d => d.status === 'available' || d.status === 'seeking_capital');
    }
    if (filters.seekingAllocation) {
      result = result.filter(d => d.status === 'submitted' || d.status === 'under_review' || d.status === 'available');
    }
    if (filters.inClosing) {
      result = result.filter(d => d.status === 'closing');
    }

    // Distress level filters
    if (filters.severelyDistressedOnly) {
      result = result.filter(d => d.tractType?.includes('SD'));
    }
    if (filters.qctOnly) {
      result = result.filter(d => d.tractType?.includes('QCT'));
    }

    // Area type filter
    if (filters.areaType === 'rural') {
      // Filter for rural/non-metro (would need metro_status field)
    } else if (filters.areaType === 'urban') {
      // Filter for urban/metro
    }

    // Project type filter
    if (filters.projectTypes.length > 0) {
      // Would filter by project sector/type if available in deal data
    }

    // Allocation range filter
    if (filters.allocationRequest.min) {
      result = result.filter(d => (d.allocation || 0) >= (filters.allocationRequest.min || 0));
    }
    if (filters.allocationRequest.max) {
      result = result.filter(d => (d.allocation || 0) <= (filters.allocationRequest.max || 0));
    }

    // State filter (kept from header dropdown)
    if (stateFilter !== 'all') result = result.filter(d => d.state === stateFilter);
    if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter);

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = (a as any)[sortField] ?? '';
      let bVal: string | number = (b as any)[sortField] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [deals, searchQuery, filters, levelFilter, statusFilter, stateFilter, sortField, sortDirection]);

  // Filter CDEs
  const filteredCDEs = useMemo(() => {
    let result = [...cdes];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.organizationName.toLowerCase().includes(query) ||
        c.missionSnippet?.toLowerCase().includes(query) ||
        c.primaryStates?.some(s => s.toLowerCase().includes(query))
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(c => c.primaryStates?.includes(stateFilter));
    }
    // Sort by remaining allocation by default
    result.sort((a, b) => (b.remainingAllocation || 0) - (a.remainingAllocation || 0));
    return result;
  }, [cdes, searchQuery, stateFilter]);

  // Filter Investors
  const filteredInvestors = useMemo(() => {
    let result = [...investors];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.organizationName.toLowerCase().includes(query) ||
        i.programs?.some(p => p.toLowerCase().includes(query))
      );
    }
    // Sort by available capital
    result.sort((a, b) => (b.availableCapital || 0) - (a.availableCapital || 0));
    return result;
  }, [investors, searchQuery]);

  // Stats for sidebar
  const programStats = useMemo(() => ({
    nmtc: deals.filter(d => d.programType === 'NMTC').length,
    htc: deals.filter(d => d.programType === 'HTC').length,
    lihtc: deals.filter(d => d.programType === 'LIHTC').length,
    oz: deals.filter(d => d.programType === 'OZ').length,
    federal: deals.filter(d => d.programLevel === 'federal').length,
    state: deals.filter(d => d.programLevel === 'state').length,
  }), [deals]);

  const uniqueStates = useMemo(() => {
    const dealStates = deals.map(d => d.state).filter(Boolean);
    const cdeStates = cdes.flatMap(c => c.primaryStates || []);
    return [...new Set([...dealStates, ...cdeStates])].sort();
  }, [deals, cdes]);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Marketplace...</p>
        </div>
      </div>
    );
  }

  // Get current items based on view
  const getCurrentItems = () => {
    switch (activeView) {
      case 'cdes': return filteredCDEs;
      case 'investors': return filteredInvestors;
      case 'deals':
      default: return filteredDeals;
    }
  };

  const currentItems = getCurrentItems();
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginatedItems = currentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(paginatedItems.map((item: any) => item.id)));
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
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

  // Dynamic sidebar items based on role
  const getSidebarItems = () => {
    const items = [];

    // Sponsors see CDEs and Investors first
    if (orgType === 'sponsor') {
      items.push(
        { id: 'cdes', label: 'CDEs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', count: cdes.length },
        { id: 'investors', label: 'Investors', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', count: investors.length },
      );
    } else {
      // CDEs and Investors see deals first
      items.push(
        { id: 'deals', label: 'Projects', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', count: deals.length },
      );
    }

    return items;
  };

  const sidebarItems = getSidebarItems();

  const getViewTitle = () => {
    if (orgType === 'sponsor') {
      return activeView === 'cdes' ? 'CDEs with Allocation' : 'Active Investors';
    }
    return marketplace.title;
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  // Render CDE cards for sponsors
  const renderCDETable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3 text-left">
            <input type="checkbox" checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0} onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('organizationName')}>
            CDE Name<SortIcon field="organizationName" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('remainingAllocation')}>
            Available Allocation<SortIcon field="remainingAllocation" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service Area</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Deal Size</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Focus Areas</th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as CDEDealCard[]).map(cde => (
          <tr key={cde.id} className="hover:bg-gray-800/50 transition-colors">
            <td className="px-4 py-3">
              <input type="checkbox" checked={selectedItems.has(cde.id)} onChange={() => handleSelectItem(cde.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-400">
                  {cde.organizationName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <Link href={`/cde/${cde.id}`} className="font-medium text-gray-100 hover:text-indigo-400">{cde.organizationName}</Link>
                  <div className="text-sm text-gray-500 line-clamp-1">{cde.missionSnippet}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="font-medium text-emerald-400">{formatCurrency(cde.remainingAllocation)}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {cde.primaryStates?.slice(0, 3).map(state => (
                  <span key={state} className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{state}</span>
                ))}
                {(cde.primaryStates?.length || 0) > 3 && (
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-500">+{(cde.primaryStates?.length || 0) - 3}</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">
              {formatCurrency(cde.dealSizeRange?.min || 0)} - {formatCurrency(cde.dealSizeRange?.max || 0)}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {cde.targetSectors?.slice(0, 2).map(sector => (
                  <span key={sector} className="px-1.5 py-0.5 bg-indigo-900/30 text-indigo-300 rounded text-xs">{sector}</span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <Link href={`/cde/${cde.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                {marketplace.requestButtonLabel} →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render Investor cards for sponsors
  const renderInvestorTable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3 text-left">
            <input type="checkbox" checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0} onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Investor</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Programs</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Available Capital</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Investment Range</th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as InvestorCard[]).map(investor => (
          <tr key={investor.id} className="hover:bg-gray-800/50 transition-colors">
            <td className="px-4 py-3">
              <input type="checkbox" checked={selectedItems.has(investor.id)} onChange={() => handleSelectItem(investor.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center text-sm font-bold text-blue-400">
                  {investor.organizationName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <Link href={`/investor/${investor.id}`} className="font-medium text-gray-100 hover:text-indigo-400">{investor.organizationName}</Link>
                  <div className="text-sm text-gray-500">{investor.investorType}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 capitalize">{investor.investorType}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {investor.programs?.map(prog => (
                  <span key={prog} className={`px-2 py-0.5 rounded text-xs font-medium border ${PROGRAM_COLORS[prog as ProgramType] || 'bg-gray-800 text-gray-400'}`}>{prog}</span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="font-medium text-blue-400">{formatCurrency(investor.availableCapital)}</span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">
              {formatCurrency(investor.minInvestment)} - {formatCurrency(investor.maxInvestment)}
            </td>
            <td className="px-4 py-3">
              <Link href={`/investor/${investor.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                Request Info →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render Deal/Project table for CDEs and Investors
  const renderDealTable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3 text-left">
            <input type="checkbox" checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0} onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('projectName')}>
            Project / Sponsor<SortIcon field="projectName" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('programType')}>
            Program<SortIcon field="programType" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('allocation')}>
            {orgType === 'cde' ? 'QEI Request' : 'Allocation'}<SortIcon field="allocation" />
          </th>
          {marketplace.showMatchScore && (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Match</th>
          )}
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('state')}>
            Location<SortIcon field="state" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tract</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800" onClick={() => handleSort('status')}>
            Status<SortIcon field="status" />
          </th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as Deal[]).map(deal => (
          <tr key={deal.id} className="hover:bg-gray-800/50 transition-colors">
            <td className="px-4 py-3">
              <input type="checkbox" checked={selectedItems.has(deal.id)} onChange={() => handleSelectItem(deal.id)}
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
            <td className="px-4 py-3"><span className="font-medium text-gray-100">${((deal.allocation || 0) / 1000000).toFixed(1)}M</span></td>
            {marketplace.showMatchScore && (
              <td className="px-4 py-3">
                {(deal as any).matchScore && (
                  <span className={`text-lg font-bold ${
                    (deal as any).matchScore >= 90 ? 'text-green-400' :
                    (deal as any).matchScore >= 80 ? 'text-yellow-400' :
                    (deal as any).matchScore >= 70 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {(deal as any).matchScore}
                  </span>
                )}
              </td>
            )}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-6 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">{US_STATES[deal.state] || deal.state?.slice(0, 2).toUpperCase()}</span>
                <span className="text-sm text-gray-300">{deal.city}, {deal.state}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {deal.tractType?.map(tract => (
                  <span key={tract} className={`px-1.5 py-0.5 rounded text-xs ${tract === 'SD' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`} title={TRACT_LABELS[tract]}>{tract}</span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status]}`}>{STATUS_LABELS[deal.status]}</span></td>
            <td className="px-4 py-3">
              <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                {marketplace.requestButtonLabel} →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render appropriate table based on active view
  const renderTable = () => {
    switch (activeView) {
      case 'cdes': return renderCDETable();
      case 'investors': return renderInvestorTable();
      case 'deals':
      default: return renderDealTable();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Sidebar - MapFilterRail */}
      {!sidebarCollapsed ? (
        <MapFilterRail
          viewMode={getViewMode()}
          filters={filters}
          onFiltersChange={setFilters}
          autoMatchEnabled={autoMatchEnabled}
          onAutoMatchToggle={setAutoMatchEnabled}
          onClose={() => setSidebarCollapsed(true)}
        />
      ) : (
        <aside className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800 flex justify-center">
            <Logo variant="icon" size="sm" />
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => { setActiveView(item.id as EntityView); setCurrentPage(1); }}
                className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${activeView === item.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                title={item.label}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-800">
            <button onClick={() => setSidebarCollapsed(false)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              title="Expand filters">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-100">{getViewTitle()}</h1>
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
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeView === 'cdes' ? 'CDEs' : activeView === 'investors' ? 'investors' : 'projects'}...`}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeView === 'deals' && (
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DealStatus | 'all')}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="under_review">Under Review</option>
                  <option value="matched">Matched</option>
                  <option value="closing">Closing</option>
                </select>
              )}

              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
                <option value="all">All States</option>
                {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
              </select>

              {orgType === 'sponsor' && (
                <Link href="/dashboard/intake" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Submit Project
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 overflow-auto">
          {currentItems.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Results Found</h3>
              <p className="text-gray-500">{marketplace.emptyStateMessage}</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                {renderTable()}
              </div>

              <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, currentItems.length)} of {currentItems.length} {activeView}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">←</button>
                  <span className="text-sm text-gray-400">Page {currentPage} of {totalPages || 1}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">→</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
