'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { fetchCDEAllocations, fetchCDECriteria, fetchCDEPipelineDeals, CDEAllocation, CDEInvestmentCriteria } from '@/lib/supabase/queries';
import { Deal } from '@/lib/data/deals';

// Types for CDE Allocation Management
interface AllocationSource {
  id: string;
  name: string;
  source: 'federal' | 'state';
  roundYear: string;
  stateProgram?: string;
  totalAmount: number;
  deployedAmount: number;
  availableAmount: number;
  deploymentDeadline: string;
  status: 'active' | 'fully_deployed' | 'expiring_soon';
  commitments: {
    nonMetroMinPercent: number;
    nonMetroCurrentPercent: number;
    ruralCDEStatus: boolean;
    severelyDistressedTarget?: number;
  };
}

interface InvestmentCriteria {
  serviceArea: {
    type: 'national' | 'multi_state' | 'single_state' | 'local';
    states: string[];
  };
  dealSize: {
    minQEI: number;
    maxQEI: number;
  };
  prioritySectors: string[];
  impactRequirements: {
    minJobsPerMillion: number;
    bipocOwnershipPreferred: boolean;
    mbeSpendingRequired: boolean;
  };
  tractPreferences: {
    severelyDistressedRequired: boolean;
    qctRequired: boolean;
    minPovertyRate?: number;
  };
}

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  city: string;
  state: string;
  requestedQEI: number;
  matchScore: number;
  status: 'new' | 'reviewing' | 'approved' | 'declined';
  submittedDate: string;
  tractType: string[];
}

// Demo Data
const DEMO_ALLOCATIONS: AllocationSource[] = [
  {
    id: 'alloc-1',
    name: 'Federal CY2023',
    source: 'federal',
    roundYear: 'CY2023',
    totalAmount: 55000000,
    deployedAmount: 32000000,
    availableAmount: 23000000,
    deploymentDeadline: '2025-12-31',
    status: 'active',
    commitments: {
      nonMetroMinPercent: 25,
      nonMetroCurrentPercent: 18,
      ruralCDEStatus: true,
      severelyDistressedTarget: 60,
    },
  },
  {
    id: 'alloc-2',
    name: 'Federal CY2024',
    source: 'federal',
    roundYear: 'CY2024',
    totalAmount: 60000000,
    deployedAmount: 0,
    availableAmount: 60000000,
    deploymentDeadline: '2026-12-31',
    status: 'active',
    commitments: {
      nonMetroMinPercent: 20,
      nonMetroCurrentPercent: 0,
      ruralCDEStatus: true,
      severelyDistressedTarget: 50,
    },
  },
  {
    id: 'alloc-3',
    name: 'Illinois State NMTC',
    source: 'state',
    roundYear: '2024',
    stateProgram: 'Illinois NMTC',
    totalAmount: 8000000,
    deployedAmount: 5000000,
    availableAmount: 3000000,
    deploymentDeadline: '2025-06-30',
    status: 'expiring_soon',
    commitments: {
      nonMetroMinPercent: 0,
      nonMetroCurrentPercent: 0,
      ruralCDEStatus: false,
    },
  },
];

const DEMO_CRITERIA: InvestmentCriteria = {
  serviceArea: {
    type: 'multi_state',
    states: ['IL', 'MO', 'IN', 'WI'],
  },
  dealSize: {
    minQEI: 2000000,
    maxQEI: 15000000,
  },
  prioritySectors: ['Healthcare', 'Manufacturing', 'Education', 'Community Facilities'],
  impactRequirements: {
    minJobsPerMillion: 28,
    bipocOwnershipPreferred: true,
    mbeSpendingRequired: true,
  },
  tractPreferences: {
    severelyDistressedRequired: false,
    qctRequired: true,
    minPovertyRate: 20,
  },
};

const DEMO_PIPELINE: PipelineDeal[] = [
  {
    id: 'pipe-1',
    projectName: 'Chicago South Side Community Center',
    sponsorName: 'Metro Development Corp',
    city: 'Chicago',
    state: 'IL',
    requestedQEI: 15000000,
    matchScore: 94,
    status: 'new',
    submittedDate: '2024-12-15',
    tractType: ['SD', 'QCT'],
  },
  {
    id: 'pipe-2',
    projectName: 'Milwaukee Workforce Training Hub',
    sponsorName: 'Badger Community Partners',
    city: 'Milwaukee',
    state: 'WI',
    requestedQEI: 8000000,
    matchScore: 87,
    status: 'reviewing',
    submittedDate: '2024-12-10',
    tractType: ['QCT'],
  },
  {
    id: 'pipe-3',
    projectName: 'Springfield Healthcare Clinic',
    sponsorName: 'Central IL Health Corp',
    city: 'Springfield',
    state: 'IL',
    requestedQEI: 4000000,
    matchScore: 82,
    status: 'reviewing',
    submittedDate: '2024-12-08',
    tractType: ['LIC'],
  },
  {
    id: 'pipe-4',
    projectName: 'St. Louis Manufacturing Expansion',
    sponsorName: 'Gateway Industrial LLC',
    city: 'St. Louis',
    state: 'MO',
    requestedQEI: 12000000,
    matchScore: 79,
    status: 'new',
    submittedDate: '2024-12-14',
    tractType: ['SD'],
  },
  {
    id: 'pipe-5',
    projectName: 'Indianapolis Charter School',
    sponsorName: 'Crossroads Education Foundation',
    city: 'Indianapolis',
    state: 'IN',
    requestedQEI: 6000000,
    matchScore: 91,
    status: 'approved',
    submittedDate: '2024-11-28',
    tractType: ['SD', 'QCT'],
  },
];

export default function CDEAllocationsPage() {
  return (
    <ProtectedRoute allowedOrgTypes={['cde']}>
      <CDEAllocationsContent />
    </ProtectedRoute>
  );
}

function CDEAllocationsContent() {
  const { orgName, organizationId, orgType } = useCurrentUser();
  const [allocations, setAllocations] = useState<AllocationSource[]>(DEMO_ALLOCATIONS);
  const [criteria, setCriteria] = useState<InvestmentCriteria>(DEMO_CRITERIA);
  const [pipeline, setPipeline] = useState<PipelineDeal[]>(DEMO_PIPELINE);
  const [showCriteriaEditor, setShowCriteriaEditor] = useState(false);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!organizationId || orgType !== 'cde') {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch allocations
        const supabaseAllocations = await fetchCDEAllocations(organizationId);
        if (supabaseAllocations.length > 0) {
          // Transform Supabase data to component format
          const transformed: AllocationSource[] = supabaseAllocations.map(alloc => ({
            id: alloc.id,
            name: `${alloc.type === 'federal' ? 'Federal' : alloc.stateCode || 'State'} ${alloc.year}`,
            source: alloc.type,
            roundYear: alloc.year,
            stateProgram: alloc.stateCode ? `${alloc.stateCode} NMTC` : undefined,
            totalAmount: alloc.awardedAmount,
            deployedAmount: alloc.deployedAmount,
            availableAmount: alloc.availableOnPlatform,
            deploymentDeadline: alloc.deploymentDeadline || '',
            status: getDeadlineStatus(alloc.deploymentDeadline, alloc.availableOnPlatform),
            commitments: {
              nonMetroMinPercent: 20, // Default values, would come from CDE preferences
              nonMetroCurrentPercent: 0,
              ruralCDEStatus: false,
              severelyDistressedTarget: 50,
            },
          }));
          setAllocations(transformed);
        }

        // Fetch investment criteria
        const cdeCriteria = await fetchCDECriteria(organizationId);
        if (cdeCriteria) {
          setCriteria({
            serviceArea: {
              type: cdeCriteria.primaryStates.length > 3 ? 'multi_state' :
                    cdeCriteria.primaryStates.length === 1 ? 'single_state' : 'multi_state',
              states: cdeCriteria.primaryStates,
            },
            dealSize: {
              minQEI: cdeCriteria.minDealSize,
              maxQEI: cdeCriteria.maxDealSize,
            },
            prioritySectors: cdeCriteria.targetSectors,
            impactRequirements: {
              minJobsPerMillion: cdeCriteria.minJobsPerMillion || 28,
              bipocOwnershipPreferred: true,
              mbeSpendingRequired: false,
            },
            tractPreferences: {
              severelyDistressedRequired: cdeCriteria.requireSeverelyDistressed,
              qctRequired: true,
              minPovertyRate: 20,
            },
          });
        }

        // Fetch pipeline deals
        const pipelineDeals = await fetchCDEPipelineDeals(organizationId);
        if (pipelineDeals.length > 0) {
          const transformedPipeline: PipelineDeal[] = pipelineDeals.map(deal => ({
            id: deal.id,
            projectName: deal.projectName,
            sponsorName: deal.sponsorName,
            city: deal.city,
            state: deal.state,
            requestedQEI: deal.allocation,
            matchScore: 85, // Would come from matching algorithm
            status: mapDealStatus(deal.status),
            submittedDate: deal.submittedDate,
            tractType: deal.tractType || [],
          }));
          setPipeline(transformedPipeline);
        }
      } catch (error) {
        console.error('Error loading CDE data:', error);
        // Keep demo data as fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [organizationId, orgType]);

  // Helper to determine allocation status based on deadline
  function getDeadlineStatus(deadline?: string, available?: number): 'active' | 'fully_deployed' | 'expiring_soon' {
    if (!available || available <= 0) return 'fully_deployed';
    if (!deadline) return 'active';
    const months = getMonthsUntilDeadline(deadline);
    if (months <= 6) return 'expiring_soon';
    return 'active';
  }

  // Map deal status to pipeline status
  function mapDealStatus(status: string): 'new' | 'reviewing' | 'approved' | 'declined' {
    switch (status) {
      case 'submitted': return 'new';
      case 'under_review': return 'reviewing';
      case 'matched':
      case 'closing':
      case 'closed': return 'approved';
      case 'withdrawn': return 'declined';
      default: return 'new';
    }
  }

  // Calculations
  const totalAvailable = allocations.reduce((sum, a) => sum + a.availableAmount, 0);
  const totalDeployed = allocations.reduce((sum, a) => sum + a.deployedAmount, 0);
  const totalAllocation = allocations.reduce((sum, a) => sum + a.totalAmount, 0);
  const deploymentPercent = totalAllocation > 0 ? (totalDeployed / totalAllocation) * 100 : 0;

  // Compliance alerts
  const complianceAlerts: string[] = [];
  allocations.forEach(alloc => {
    if (alloc.commitments.nonMetroCurrentPercent < alloc.commitments.nonMetroMinPercent) {
      complianceAlerts.push(`${alloc.name}: Non-metro at ${alloc.commitments.nonMetroCurrentPercent}% (need ${alloc.commitments.nonMetroMinPercent}%)`);
    }
    if (alloc.status === 'expiring_soon') {
      complianceAlerts.push(`${alloc.name}: Deployment deadline approaching!`);
    }
  });

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const getMonthsUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const months = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
    return months;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: PipelineDeal['status']) => {
    const styles = {
      new: 'bg-blue-900/50 text-blue-400',
      reviewing: 'bg-yellow-900/50 text-yellow-400',
      approved: 'bg-green-900/50 text-green-400',
      declined: 'bg-red-900/50 text-red-400',
    };
    return styles[status];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Allocation Management</h1>
          <p className="text-gray-400 mt-1">{orgName || 'Your Organization'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCriteriaEditor(true)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Investment Criteria
          </button>
          <button
            onClick={() => setShowAddAllocation(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            + Add Allocation
          </button>
        </div>
      </div>

      {/* Compliance Alerts */}
      {complianceAlerts.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-400">Compliance Attention Needed</h3>
              <ul className="mt-1 space-y-1">
                {complianceAlerts.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-200/80">• {alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Allocation Overview</h2>
          <span className="text-sm text-gray-400">{allocations.length} active sources</span>
        </div>
        
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-400">Total Allocation</p>
            <p className="text-2xl font-bold text-gray-100">{formatCurrency(totalAllocation)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Deployed</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalDeployed)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Available</p>
            <p className="text-2xl font-bold text-indigo-400">{formatCurrency(totalAvailable)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Pipeline Requests</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(pipeline.reduce((s, p) => s + p.requestedQEI, 0))}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Deployment Progress</span>
            <span className="text-gray-300">{deploymentPercent.toFixed(0)}% deployed</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${deploymentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Allocation Sources Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Allocation Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allocations.map(alloc => {
            const monthsLeft = getMonthsUntilDeadline(alloc.deploymentDeadline);
            const deployPercent = (alloc.deployedAmount / alloc.totalAmount) * 100;
            
            return (
              <div 
                key={alloc.id} 
                className={`bg-gray-900 rounded-xl border p-5 cursor-pointer transition-all hover:border-indigo-500 ${
                  alloc.status === 'expiring_soon' ? 'border-amber-600' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-100">{alloc.name}</h3>
                    <p className="text-sm text-gray-500">{alloc.source === 'federal' ? 'Federal NMTC' : alloc.stateProgram}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alloc.status === 'active' ? 'bg-green-900/50 text-green-400' :
                    alloc.status === 'expiring_soon' ? 'bg-amber-900/50 text-amber-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {alloc.status === 'expiring_soon' ? 'Urgent' : alloc.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gray-200 font-medium">{formatCurrency(alloc.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available</span>
                    <span className="text-indigo-400 font-medium">{formatCurrency(alloc.availableAmount)}</span>
                  </div>
                  
                  {/* Mini progress */}
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${deployPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-2 border-t border-gray-800">
                    <span className="text-gray-500">Deadline</span>
                    <span className={`font-medium ${monthsLeft <= 6 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {monthsLeft} months left
                    </span>
                  </div>
                </div>

                {/* Compliance indicators */}
                {alloc.commitments.nonMetroCurrentPercent < alloc.commitments.nonMetroMinPercent && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      <span>Non-metro: {alloc.commitments.nonMetroCurrentPercent}% of {alloc.commitments.nonMetroMinPercent}% min</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Investment Criteria Summary */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Investment Criteria</h2>
          <button 
            onClick={() => setShowCriteriaEditor(true)}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Edit →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Service Area</p>
            <p className="text-gray-200 font-medium">{criteria.serviceArea.states.join(', ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Deal Size</p>
            <p className="text-gray-200 font-medium">
              {formatCurrency(criteria.dealSize.minQEI)} - {formatCurrency(criteria.dealSize.maxQEI)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Priority Sectors</p>
            <div className="flex flex-wrap gap-1">
              {criteria.prioritySectors.slice(0, 3).map(sector => (
                <span key={sector} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">{sector}</span>
              ))}
              {criteria.prioritySectors.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">+{criteria.prioritySectors.length - 3}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Impact Requirements</p>
            <p className="text-gray-200 font-medium">{criteria.impactRequirements.minJobsPerMillion} jobs/$M</p>
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Matched Pipeline</h2>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs font-medium">
              {pipeline.filter(p => p.status === 'new').length} new
            </span>
            <Link href="/deals" className="text-sm text-indigo-400 hover:text-indigo-300">
              Browse Marketplace →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">QEI Request</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pipeline.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-100">{deal.projectName}</p>
                      <p className="text-sm text-gray-500">{deal.sponsorName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{deal.city}, {deal.state}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-100">{formatCurrency(deal.requestedQEI)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}>
                      {deal.matchScore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {deal.tractType.map(tract => (
                        <span 
                          key={tract} 
                          className={`px-1.5 py-0.5 rounded text-xs ${
                            tract === 'SD' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {tract}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(deal.status)}`}>
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/deals/${deal.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Criteria Editor Modal */}
      {showCriteriaEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCriteriaEditor(false)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-6">Edit Investment Criteria</h3>
            
            <div className="space-y-6">
              {/* Service Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Area Type</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
                  <option value="national">National</option>
                  <option value="multi_state">Multi-State</option>
                  <option value="single_state">Single State</option>
                  <option value="local">Local (City/County)</option>
                </select>
              </div>

              {/* States */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target States</label>
                <div className="flex flex-wrap gap-2">
                  {['IL', 'MO', 'IN', 'WI', 'MI', 'OH', 'IA', 'MN'].map(state => (
                    <button
                      key={state}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        criteria.serviceArea.states.includes(state)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deal Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minimum QEI</label>
                  <input
                    type="text"
                    defaultValue="$2,000,000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Maximum QEI</label>
                  <input
                    type="text"
                    defaultValue="$15,000,000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>
              </div>

              {/* Priority Sectors */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority Sectors</label>
                <div className="flex flex-wrap gap-2">
                  {['Healthcare', 'Manufacturing', 'Education', 'Community Facilities', 'Retail', 'Mixed-Use', 'Childcare', 'Workforce'].map(sector => (
                    <button
                      key={sector}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        criteria.prioritySectors.includes(sector)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Impact Requirements</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Minimum jobs per $1M QEI</span>
                    <input
                      type="number"
                      defaultValue={28}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">BIPOC ownership preferred</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">MBE spending required</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Tract Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tract Preferences</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Severely Distressed required</span>
                    <input type="checkbox" className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">QCT required</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Minimum poverty rate</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={20}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-right"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCriteriaEditor(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCriteriaEditor(false);
                  alert('Criteria saved! AutoMatch will use these preferences.');
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Save Criteria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Allocation Modal */}
      {showAddAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddAllocation(false)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-6">Add Allocation Source</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source Type</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
                  <option value="federal">Federal NMTC</option>
                  <option value="state">State NMTC Program</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Round / Year</label>
                <input
                  type="text"
                  placeholder="e.g., CY2025"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Allocation Amount</label>
                <input
                  type="text"
                  placeholder="$0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Deployment Deadline</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Non-Metro Commitment (%)</label>
                <input
                  type="number"
                  placeholder="20"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAllocation(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddAllocation(false);
                  alert('Allocation added successfully!');
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Add Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
