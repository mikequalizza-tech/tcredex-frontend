'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import MarketplaceFooter from '@/components/layout/MarketplaceFooter';

// Types
type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
type ProgramLevel = 'federal' | 'state';
type DealStatus = 'available' | 'under_review' | 'matched' | 'closing' | 'closed';
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

// Demo data - 25 sample deals
const DEMO_DEALS: MarketplaceDeal[] = [
  { id: 'deal-001', projectName: 'Downtown Community Center', sponsorName: 'Metro Development Corp', website: 'www.metrodev.com', programType: 'NMTC', programLevel: 'federal', allocation: 15000000, creditPrice: 0.76, state: 'Illinois', city: 'Chicago', tractType: ['QCT', 'SD'], status: 'available', foundedYear: 2018, submittedDate: '2024-12-01', povertyRate: 28.4, visible: true },
  { id: 'deal-002', projectName: 'Heritage Theater Restoration', sponsorName: 'Historic Holdings LLC', website: 'www.historicholdings.com', programType: 'HTC', programLevel: 'federal', allocation: 8500000, creditPrice: 0.92, state: 'Ohio', city: 'Cleveland', tractType: ['QCT'], status: 'under_review', foundedYear: 2015, submittedDate: '2024-11-15', visible: true },
  { id: 'deal-003', projectName: 'Riverside Affordable Housing', sponsorName: 'Community Builders Inc', website: 'www.communitybuilders.org', programType: 'LIHTC', programLevel: 'federal', allocation: 22000000, creditPrice: 0.88, state: 'Michigan', city: 'Detroit', tractType: ['QCT', 'DDA'], status: 'available', foundedYear: 2010, submittedDate: '2024-12-05', povertyRate: 32.1, visible: true },
  { id: 'deal-004', projectName: 'Bay Area Workforce Housing', sponsorName: 'Golden State Developers', website: 'www.goldenstatedev.com', programType: 'LIHTC', programLevel: 'state', stateProgram: 'CA State LIHTC', allocation: 18000000, creditPrice: 0.91, state: 'California', city: 'Oakland', tractType: ['QCT'], status: 'available', foundedYear: 2019, submittedDate: '2024-12-08', povertyRate: 26.5, visible: true },
  { id: 'deal-005', projectName: 'Tech Manufacturing Hub', sponsorName: 'Industrial Partners', website: 'www.industrialpartners.com', programType: 'NMTC', programLevel: 'federal', allocation: 18000000, creditPrice: 0.75, state: 'Indiana', city: 'Indianapolis', tractType: ['LIC', 'SD'], status: 'matched', foundedYear: 2020, submittedDate: '2024-10-20', povertyRate: 24.5, visible: true },
  { id: 'deal-006', projectName: 'Empire State Historic Lofts', sponsorName: 'NY Heritage Partners', website: 'www.nyheritage.com', programType: 'HTC', programLevel: 'state', stateProgram: 'NY State HTC', allocation: 12000000, creditPrice: 0.88, state: 'New York', city: 'Buffalo', tractType: ['QCT'], status: 'available', foundedYear: 2017, submittedDate: '2024-12-03', visible: true },
  { id: 'deal-007', projectName: 'Main Street Revitalization', sponsorName: 'Downtown Partners LLC', website: 'www.downtownpartners.com', programType: 'OZ', programLevel: 'federal', allocation: 10000000, creditPrice: 0.85, state: 'Wisconsin', city: 'Milwaukee', tractType: ['QCT'], status: 'closing', foundedYear: 2019, submittedDate: '2024-09-15', visible: true },
  { id: 'deal-008', projectName: 'Rural Health Clinic Network', sponsorName: 'HealthFirst Foundation', website: 'www.healthfirst.org', programType: 'NMTC', programLevel: 'federal', allocation: 12000000, creditPrice: 0.74, state: 'Iowa', city: 'Des Moines', tractType: ['LIC'], status: 'available', foundedYear: 2012, submittedDate: '2024-12-08', povertyRate: 22.3, visible: true },
  { id: 'deal-009', projectName: 'Missouri Affordable Homes', sponsorName: 'Gateway Housing', website: 'www.gatewayhousing.org', programType: 'LIHTC', programLevel: 'state', stateProgram: 'MO State LIHTC', allocation: 9500000, creditPrice: 0.84, state: 'Missouri', city: 'Kansas City', tractType: ['QCT', 'DDA'], status: 'available', foundedYear: 2016, submittedDate: '2024-12-06', povertyRate: 29.8, visible: true },
  { id: 'deal-010', projectName: 'Eastside Grocery Co-Op', sponsorName: 'Food Access Initiative', website: 'www.foodaccess.org', programType: 'NMTC', programLevel: 'federal', allocation: 4500000, creditPrice: 0.77, state: 'Minnesota', city: 'Minneapolis', tractType: ['QCT', 'SD'], status: 'available', foundedYear: 2021, submittedDate: '2024-12-10', povertyRate: 35.2, visible: true },
  { id: 'deal-011', projectName: 'Virginia Historic Mill', sponsorName: 'Commonwealth Restoration', website: 'www.commonwealthrest.com', programType: 'HTC', programLevel: 'state', stateProgram: 'VA State HTC', allocation: 7500000, creditPrice: 0.90, state: 'Virginia', city: 'Richmond', tractType: ['QCT'], status: 'under_review', foundedYear: 2014, submittedDate: '2024-11-28', visible: true },
  { id: 'deal-012', projectName: 'Workforce Training Center', sponsorName: 'Skills Development Corp', website: 'www.skillsdev.com', programType: 'NMTC', programLevel: 'federal', allocation: 9000000, creditPrice: 0.76, state: 'Missouri', city: 'St. Louis', tractType: ['QCT'], status: 'under_review', foundedYear: 2017, submittedDate: '2024-11-25', povertyRate: 26.8, visible: true },
  { id: 'deal-013', projectName: 'Arts District Lofts', sponsorName: 'Creative Spaces LLC', website: 'www.creativespaces.com', programType: 'HTC', programLevel: 'federal', allocation: 14000000, creditPrice: 0.91, state: 'Pennsylvania', city: 'Pittsburgh', tractType: ['QCT'], status: 'available', foundedYear: 2016, submittedDate: '2024-12-02', visible: true },
  { id: 'deal-014', projectName: 'Green Energy Campus', sponsorName: 'Sustainable Ventures', website: 'www.sustainableventures.com', programType: 'OZ', programLevel: 'federal', allocation: 25000000, creditPrice: 0.82, state: 'Colorado', city: 'Denver', tractType: ['QCT', 'SD'], status: 'matched', foundedYear: 2022, submittedDate: '2024-10-30', visible: true },
  { id: 'deal-015', projectName: 'Georgia Workforce Housing', sponsorName: 'Peach State Housing', website: 'www.peachstatehousing.com', programType: 'LIHTC', programLevel: 'state', stateProgram: 'GA State LIHTC', allocation: 14000000, creditPrice: 0.86, state: 'Georgia', city: 'Atlanta', tractType: ['QCT', 'DDA'], status: 'available', foundedYear: 2018, submittedDate: '2024-12-04', povertyRate: 31.2, visible: true },
  { id: 'deal-016', projectName: 'Senior Living Community', sponsorName: 'Elder Care Partners', website: 'www.eldercarepartners.com', programType: 'LIHTC', programLevel: 'federal', allocation: 18500000, creditPrice: 0.87, state: 'Florida', city: 'Tampa', tractType: ['DDA'], status: 'available', foundedYear: 2014, submittedDate: '2024-12-06', visible: true },
  { id: 'deal-017', projectName: 'Mixed-Use Transit Hub', sponsorName: 'Urban Transit Development', website: 'www.urbantransit.com', programType: 'NMTC', programLevel: 'federal', allocation: 32000000, creditPrice: 0.78, state: 'California', city: 'Los Angeles', tractType: ['QCT', 'LIC'], status: 'under_review', foundedYear: 2019, submittedDate: '2024-11-18', povertyRate: 29.1, visible: true },
  { id: 'deal-018', projectName: 'Community Hospital Expansion', sponsorName: 'Regional Health Systems', website: 'www.regionalhealthsys.org', programType: 'NMTC', programLevel: 'federal', allocation: 28000000, creditPrice: 0.75, state: 'Texas', city: 'Houston', tractType: ['QCT', 'SD'], status: 'available', foundedYear: 2008, submittedDate: '2024-12-09', povertyRate: 31.4, visible: true },
  { id: 'deal-019', projectName: 'Historic Hotel Renovation', sponsorName: 'Landmark Properties', website: 'www.landmarkprops.com', programType: 'HTC', programLevel: 'federal', allocation: 11000000, creditPrice: 0.93, state: 'Louisiana', city: 'New Orleans', tractType: ['QCT'], status: 'closing', foundedYear: 2011, submittedDate: '2024-09-28', visible: true },
  { id: 'deal-020', projectName: 'Maryland Historic Theater', sponsorName: 'Chesapeake Restoration', website: 'www.chesapeakerest.com', programType: 'HTC', programLevel: 'state', stateProgram: 'MD State HTC', allocation: 6500000, creditPrice: 0.85, state: 'Maryland', city: 'Baltimore', tractType: ['QCT'], status: 'available', foundedYear: 2019, submittedDate: '2024-12-07', visible: true },
  { id: 'deal-021', projectName: 'Youth Education Center', sponsorName: 'Future Leaders Foundation', website: 'www.futureleaders.org', programType: 'NMTC', programLevel: 'federal', allocation: 7500000, creditPrice: 0.76, state: 'Georgia', city: 'Savannah', tractType: ['QCT', 'SD'], status: 'available', foundedYear: 2020, submittedDate: '2024-12-11', povertyRate: 33.8, visible: true },
  { id: 'deal-022', projectName: 'Industrial Park Phase II', sponsorName: 'Commerce Development Group', website: 'www.commercedev.com', programType: 'OZ', programLevel: 'federal', allocation: 45000000, creditPrice: 0.80, state: 'Arizona', city: 'Phoenix', tractType: ['QCT'], status: 'matched', foundedYear: 2018, submittedDate: '2024-10-15', visible: true },
  { id: 'deal-023', projectName: 'Connecticut Affordable Housing', sponsorName: 'Nutmeg Housing Partners', website: 'www.nutmeghousing.com', programType: 'LIHTC', programLevel: 'state', stateProgram: 'CT State LIHTC', allocation: 11000000, creditPrice: 0.89, state: 'Connecticut', city: 'Hartford', tractType: ['QCT', 'DDA'], status: 'available', foundedYear: 2015, submittedDate: '2024-12-02', povertyRate: 27.4, visible: true },
  { id: 'deal-024', projectName: 'Veterans Housing Complex', sponsorName: 'Heroes Home Foundation', website: 'www.heroeshome.org', programType: 'LIHTC', programLevel: 'federal', allocation: 16000000, creditPrice: 0.89, state: 'Virginia', city: 'Norfolk', tractType: ['QCT', 'DDA'], status: 'under_review', foundedYear: 2015, submittedDate: '2024-11-22', visible: true },
  { id: 'deal-025', projectName: 'Waterfront Redevelopment', sponsorName: 'Coastal Development LLC', website: 'www.coastaldev.com', programType: 'OZ', programLevel: 'federal', allocation: 38000000, creditPrice: 0.83, state: 'Maryland', city: 'Annapolis', tractType: ['QCT', 'SD'], status: 'available', foundedYear: 2017, submittedDate: '2024-12-03', povertyRate: 30.2, visible: true },
];

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
  available: 'bg-green-900/50 text-green-400',
  under_review: 'bg-amber-900/50 text-amber-400',
  matched: 'bg-purple-900/50 text-purple-400',
  closing: 'bg-blue-900/50 text-blue-400',
  closed: 'bg-gray-800 text-gray-400',
};

const STATUS_LABELS: Record<DealStatus, string> = {
  available: 'Available',
  under_review: 'Under Review',
  matched: 'Matched',
  closing: 'Closing',
  closed: 'Closed',
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

  const uniqueStates = useMemo(() => [...new Set(DEMO_DEALS.map(d => d.state))].sort(), []);

  const filteredDeals = useMemo(() => {
    let result = DEMO_DEALS.filter(d => d.visible);
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
  }, [searchQuery, programFilter, levelFilter, statusFilter, stateFilter, sortField, sortDirection]);

  const programStats = useMemo(() => {
    const visible = DEMO_DEALS.filter(d => d.visible);
    return {
      nmtc: visible.filter(d => d.programType === 'NMTC').length,
      htc: visible.filter(d => d.programType === 'HTC').length,
      lihtc: visible.filter(d => d.programType === 'LIHTC').length,
      oz: visible.filter(d => d.programType === 'OZ').length,
      federal: visible.filter(d => d.programLevel === 'federal').length,
      state: visible.filter(d => d.programLevel === 'state').length,
    };
  }, []);

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
    { id: 'deals', label: 'Projects', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', count: DEMO_DEALS.filter(d => d.visible).length },
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
