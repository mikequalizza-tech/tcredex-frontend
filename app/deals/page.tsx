'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth';
import MarketplaceFooter from '@/components/layout/MarketplaceFooter';
import { 
  DEMO_DEALS, 
  PROGRAM_COLORS, 
  STATUS_CONFIG,
  TRACT_LABELS,
  US_STATES,
  getProgramStats,
  type ProgramType,
  type Deal
} from '@/lib/data/deals';
import { DEMO_CDES, getCDEStats, type CDE, type MissionFocus, MISSION_LABELS } from '@/lib/data/cdes';
import { DEMO_INVESTORS, getInvestorStats, type Investor, type ProgramInterest, INVESTOR_TYPE_LABELS } from '@/lib/data/investors';

// =============================================================================
// PHASE-BASED VISIBILITY MODEL (ChatGPT + Young Bull alignment)
// =============================================================================
// 
// Core Principle: "Sponsors do not browse the market. The system reveals 
// counterparties only when the project reaches that phase."
//
// Project Phases:
//   'investor' - All projects start here. Sponsor sees INVESTORS only.
//   'cde'      - NMTC projects advance here. Sponsor sees INVESTORS + CDEs.
//   'closed'   - Read-only historical view.
//
// Phase Progression:
//   HTC/LIHTC/OZ/Brownfield: investor → closed (never needs CDE)
//   NMTC:                    investor → cde → closed (needs both sequentially)
//
// This removes program logic from UI. Just check phase.
// =============================================================================

type ProjectPhase = 'investor' | 'cde' | 'closed';
type MarketplaceView = 'investors' | 'cdes' | 'projects';
type SortDirection = 'asc' | 'desc';

// Simulate sponsor's projects with phases
// In production, this comes from Supabase with real phase field
interface SponsorProject {
  id: string;
  name: string;
  program: ProgramType;
  phase: ProjectPhase;
}

// Demo: Sponsor has projects in different phases
const DEMO_SPONSOR_PROJECTS: SponsorProject[] = [
  { id: 'sp-1', name: 'Downtown Health Clinic', program: 'NMTC', phase: 'cde' },      // NMTC in CDE phase
  { id: 'sp-2', name: 'Historic Mill Renovation', program: 'HTC', phase: 'investor' }, // HTC in Investor phase
  { id: 'sp-3', name: 'Affordable Housing Complex', program: 'LIHTC', phase: 'investor' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, orgType, user } = useCurrentUser();

  // ==========================================================================
  // PHASE-BASED REQUIREMENTS RESOLVER
  // ==========================================================================
  // This is the key abstraction. UI just reads the result.
  const getPhaseRequirements = (projects: SponsorProject[]) => {
    // Check if ANY project is in a phase that needs investors
    const needsInvestor = projects.some(p => 
      p.phase === 'investor' || p.phase === 'cde'
    );
    
    // Check if ANY project is in CDE phase (NMTC advanced to needing CDE)
    const needsCDE = projects.some(p => p.phase === 'cde');
    
    return { needsInvestor, needsCDE };
  };

  // For demo, use sponsor projects. In production, fetch from Supabase.
  const sponsorProjects = orgType === 'sponsor' ? DEMO_SPONSOR_PROJECTS : [];
  const { needsInvestor, needsCDE } = getPhaseRequirements(sponsorProjects);

  // Determine default view based on role AND phase requirements
  const getDefaultView = (): MarketplaceView => {
    if (orgType === 'sponsor') {
      // Sponsors see investors first (always needed)
      return 'investors';
    }
    if (orgType === 'cde') return 'projects';
    if (orgType === 'investor') return 'projects';
    return 'projects';
  };

  // State
  const [activeView, setActiveView] = useState<MarketplaceView>(getDefaultView());
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<ProgramInterest | 'all'>('all');
  const [missionFilter, setMissionFilter] = useState<MissionFocus | 'all'>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Update view when orgType changes
  useEffect(() => {
    setActiveView(getDefaultView());
  }, [orgType]);

  // Stats
  const cdeStats = useMemo(() => getCDEStats(), []);
  const investorStats = useMemo(() => getInvestorStats(), []);
  const projectStats = useMemo(() => getProgramStats(), []);

  // Filtered CDEs
  const filteredCDEs = useMemo(() => {
    let result = [...DEMO_CDES];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.headquartersCity.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(c => c.serviceArea.includes('ALL') || c.serviceArea.includes(stateFilter));
    }
    if (missionFilter !== 'all') {
      result = result.filter(c => c.missionFocus.includes(missionFilter));
    }
    return result;
  }, [searchQuery, stateFilter, missionFilter]);

  // Filtered Investors
  const filteredInvestors = useMemo(() => {
    let result = [...DEMO_INVESTORS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(i => i.geographicFocus.includes('ALL') || i.geographicFocus.includes(stateFilter));
    }
    if (programFilter !== 'all') {
      result = result.filter(i => i.programs.includes(programFilter));
    }
    return result;
  }, [searchQuery, stateFilter, programFilter]);

  // Filtered Projects (for CDE/Investor view)
  const filteredProjects = useMemo(() => {
    let result = DEMO_DEALS.filter(d => d.visible);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.projectName.toLowerCase().includes(q) || 
        d.sponsorName.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') {
      result = result.filter(d => d.state === stateFilter);
    }
    if (programFilter !== 'all') {
      result = result.filter(d => d.programType === programFilter);
    }
    return result;
  }, [searchQuery, stateFilter, programFilter]);

  // Unique states for filter
  const allStates = useMemo(() => {
    const states = new Set<string>();
    DEMO_DEALS.forEach(d => states.add(d.state));
    DEMO_CDES.forEach(c => c.serviceArea.forEach(s => { if (s !== 'ALL') states.add(s); }));
    return [...states].sort();
  }, []);

  // Auth redirect
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
  // PHASE-BASED VIEW OPTIONS
  // ==========================================================================
  // Sponsors ONLY see tabs for what their project phases require.
  // CDEs see projects. Investors see projects + CDEs.
  const getViewOptions = (): Array<{ id: MarketplaceView; label: string; sublabel?: string; count: number }> => {
    if (orgType === 'sponsor') {
      const options: Array<{ id: MarketplaceView; label: string; sublabel?: string; count: number }> = [];
      
      // Investors tab shows if ANY project needs investor (phase = investor or cde)
      if (needsInvestor) {
        options.push({ 
          id: 'investors', 
          label: 'Find Investors', 
          sublabel: 'Credit buyers for your projects',
          count: investorStats.active 
        });
      }
      
      // CDEs tab ONLY shows if project has advanced to CDE phase
      if (needsCDE) {
        options.push({ 
          id: 'cdes', 
          label: 'Find CDEs', 
          sublabel: 'NMTC allocation (phase unlocked)',
          count: cdeStats.accepting 
        });
      }
      
      // Fallback if no projects
      if (options.length === 0) {
        options.push({ 
          id: 'investors', 
          label: 'Find Investors', 
          sublabel: 'Submit a project first',
          count: investorStats.active 
        });
      }
      
      return options;
    }
    
    if (orgType === 'cde') {
      return [
        { id: 'projects', label: 'Browse Projects', sublabel: 'In CDE phase', count: projectStats.nmtc },
        { id: 'investors', label: 'Find Investors', sublabel: 'Credit buyers', count: investorStats.active },
      ];
    }
    
    if (orgType === 'investor') {
      return [
        { id: 'projects', label: 'Browse Projects', sublabel: 'Investment opportunities', count: projectStats.total },
        { id: 'cdes', label: 'Browse CDEs', sublabel: 'For NMTC deals', count: cdeStats.total },
      ];
    }
    
    // Admin/default - see everything
    return [
      { id: 'projects', label: 'Projects', count: projectStats.total },
      { id: 'cdes', label: 'CDEs', count: cdeStats.total },
      { id: 'investors', label: 'Investors', count: investorStats.total },
    ];
  };

  const viewOptions = getViewOptions();
  
  // Page title based on role and view
  const getPageTitle = () => {
    if (orgType === 'sponsor') {
      if (activeView === 'cdes') return 'Find CDE Allocation';
      return 'Find Investors';
    }
    if (orgType === 'cde') {
      if (activeView === 'projects') return 'Projects Seeking Allocation';
      return 'Find Credit Buyers';
    }
    if (orgType === 'investor') {
      if (activeView === 'projects') return 'Investment Opportunities';
      return 'CDE Partners';
    }
    return 'Marketplace';
  };


  // ==========================================================================
  // CARD COMPONENTS
  // ==========================================================================
  
  // CDE Card
  const CDECard = ({ cde }: { cde: CDE }) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{cde.name}</h3>
          <p className="text-sm text-gray-500">{cde.headquartersCity}, {cde.headquartersState}</p>
        </div>
        {cde.acceptingApplications ? (
          <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded-full">Accepting</span>
        ) : (
          <span className="px-2 py-1 bg-gray-800 text-gray-500 text-xs font-medium rounded-full">Closed</span>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{cde.description}</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-green-400">${(cde.availableAllocation / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Deal Range</p>
          <p className="text-sm font-medium text-white">${(cde.minDealSize / 1000000).toFixed(0)}-{(cde.maxDealSize / 1000000).toFixed(0)}M</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {cde.missionFocus.slice(0, 3).map(m => (
          <span key={m} className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-xs rounded">{MISSION_LABELS[m]}</span>
        ))}
        {cde.missionFocus.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">+{cde.missionFocus.length - 3}</span>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <span className="text-gray-400">{cde.projectsClosed}</span> projects closed
        </div>
        <Link href={`/cde/${cde.slug}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );

  // Investor Card
  const InvestorCard = ({ investor }: { investor: Investor }) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{investor.name}</h3>
          <p className="text-sm text-gray-500">{INVESTOR_TYPE_LABELS[investor.investorType]}</p>
        </div>
        {investor.activelyInvesting ? (
          <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-xs font-medium rounded-full">Active</span>
        ) : (
          <span className="px-2 py-1 bg-gray-800 text-gray-500 text-xs font-medium rounded-full">Paused</span>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{investor.description}</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-lg font-bold text-blue-400">${(investor.availableCapital / 1000000).toFixed(0)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Deal Range</p>
          <p className="text-sm font-medium text-white">${(investor.minInvestment / 1000000).toFixed(0)}-{(investor.maxInvestment / 1000000).toFixed(0)}M</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {investor.programs.map(p => (
          <span key={p} className={`px-2 py-0.5 text-xs rounded ${
            p === 'NMTC' ? 'bg-emerald-900/30 text-emerald-300' :
            p === 'HTC' ? 'bg-blue-900/30 text-blue-300' :
            p === 'LIHTC' ? 'bg-purple-900/30 text-purple-300' :
            p === 'OZ' ? 'bg-amber-900/30 text-amber-300' :
            'bg-teal-900/30 text-teal-300'
          }`}>{p}</span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <span className="text-gray-400">{investor.dealsCompleted}</span> deals completed
        </div>
        <Link href={`/investor/${investor.slug}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );

  // Project Card (for CDE/Investor view)
  const ProjectCard = ({ deal }: { deal: Deal }) => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-emerald-500/50 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mb-2 ${PROGRAM_COLORS[deal.programType].bg} ${PROGRAM_COLORS[deal.programType].text} ${PROGRAM_COLORS[deal.programType].border}`}>
            {deal.programType}
          </span>
          <h3 className="font-semibold text-white text-lg">{deal.projectName}</h3>
          <p className="text-sm text-gray-500">{deal.sponsorName}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_CONFIG[deal.status].color}`}>
          {STATUS_CONFIG[deal.status].label}
        </span>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">{deal.city}, {deal.state}</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Allocation</p>
          <p className="text-lg font-bold text-white">${(deal.allocation / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Credit Price</p>
          <p className="text-lg font-bold text-green-400">${deal.creditPrice.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {deal.tractType.map(t => (
          <span key={t} className={`px-2 py-0.5 text-xs rounded ${t === 'SD' ? 'bg-red-900/30 text-red-300' : 'bg-gray-800 text-gray-400'}`} title={TRACT_LABELS[t]}>
            {t}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          {US_STATES[deal.state] || deal.state}
        </div>
        <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  );


  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Sidebar - Phase Aware */}
      <aside className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
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

        {/* Role Context - Shows what phase logic determined */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/30">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Role</p>
            <p className="text-sm font-medium text-white capitalize">{orgType || 'Guest'}</p>
            {orgType === 'sponsor' && (
              <div className="mt-2 text-xs">
                {needsCDE ? (
                  <span className="text-purple-400">● NMTC phase unlocked</span>
                ) : (
                  <span className="text-blue-400">● Investor phase active</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Options - Phase-driven for Sponsors */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            {sidebarCollapsed ? '—' : 'Browse'}
          </div>
          {viewOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveView(opt.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === opt.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={sidebarCollapsed ? opt.label : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {opt.id === 'cdes' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                {opt.id === 'investors' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {opt.id === 'projects' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              </svg>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left">
                  <span className="block">{opt.label}</span>
                  {opt.sublabel && <span className="text-xs opacity-70">{opt.sublabel}</span>}
                </div>
              )}
              {!sidebarCollapsed && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeView === opt.id ? 'bg-indigo-500' : 'bg-gray-800 text-gray-500'}`}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}

          {/* Quick Links */}
          <div className="pt-4 mt-4 border-t border-gray-800">
            <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {sidebarCollapsed ? '—' : 'Quick Links'}
            </div>
            {orgType === 'sponsor' && (
              <>
                <Link href="/projects" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {!sidebarCollapsed && <span>My Projects</span>}
                </Link>
                <Link href="/deals/new" className="flex items-center gap-3 px-3 py-2 text-sm text-green-400 hover:bg-gray-800 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {!sidebarCollapsed && <span>Submit Project</span>}
                </Link>
              </>
            )}
            {orgType === 'cde' && (
              <Link href="/cde/pipeline" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {!sidebarCollapsed && <span>My Pipeline</span>}
              </Link>
            )}
            {orgType === 'investor' && (
              <Link href="/investor/portfolio" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {!sidebarCollapsed && <span>My Portfolio</span>}
              </Link>
            )}
            <Link href="/map" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {!sidebarCollapsed && <span>Eligibility Map</span>}
            </Link>
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500">
                {activeView === 'cdes' && `${filteredCDEs.length} CDEs with $${(filteredCDEs.reduce((s, c) => s + c.availableAllocation, 0) / 1000000000).toFixed(1)}B available`}
                {activeView === 'investors' && `${filteredInvestors.length} investors with $${(filteredInvestors.reduce((s, i) => s + i.availableCapital, 0) / 1000000000).toFixed(1)}B available`}
                {activeView === 'projects' && `${filteredProjects.length} projects seeking $${(filteredProjects.reduce((s, p) => s + p.allocation, 0) / 1000000000).toFixed(1)}B`}
              </p>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeView}...`}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All States</option>
                {allStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {(activeView === 'investors' || activeView === 'projects') && (
                <select
                  value={programFilter}
                  onChange={e => setProgramFilter(e.target.value as ProgramInterest | 'all')}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Programs</option>
                  <option value="NMTC">NMTC</option>
                  <option value="HTC">HTC</option>
                  <option value="LIHTC">LIHTC</option>
                  <option value="OZ">Opportunity Zone</option>
                  <option value="Brownfield">Brownfield</option>
                </select>
              )}

              {activeView === 'cdes' && (
                <select
                  value={missionFilter}
                  onChange={e => setMissionFilter(e.target.value as MissionFocus | 'all')}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Missions</option>
                  {Object.entries(MISSION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {activeView === 'cdes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCDEs.map(cde => <CDECard key={cde.id} cde={cde} />)}
              {filteredCDEs.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No CDEs match your filters</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'investors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestors.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
              {filteredInvestors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No investors match your filters</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(deal => <ProjectCard key={deal.id} deal={deal} />)}
              {filteredProjects.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No projects match your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
