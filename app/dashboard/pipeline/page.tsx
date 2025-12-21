'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';

// ============================================
// ROLE-SPECIFIC STAGE CONFIGURATIONS
// ============================================

type SponsorStage = 'draft' | 'submitted' | 'loi_received' | 'committed' | 'closing';
type CDEStage = 'new' | 'reviewing' | 'loi_issued' | 'committed' | 'closing';
type InvestorStage = 'reviewing' | 'loi_issued' | 'committed' | 'closing';
type PipelineStage = SponsorStage | CDEStage | InvestorStage;

interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
  description?: string;
}

const SPONSOR_STAGES: Record<SponsorStage, StageConfig> = {
  draft: { label: 'Drafts', color: 'text-gray-400', bgColor: 'bg-gray-800/50', description: 'In progress' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bgColor: 'bg-blue-900/50', description: 'Awaiting CDE review' },
  loi_received: { label: 'LOI Received', color: 'text-purple-400', bgColor: 'bg-purple-900/50', description: 'Letter of Intent from CDE' },
  committed: { label: 'Committed', color: 'text-green-400', bgColor: 'bg-green-900/50', description: 'Commitment letter signed' },
  closing: { label: 'Closing', color: 'text-indigo-400', bgColor: 'bg-indigo-900/50', description: 'In closing process' },
};

const CDE_STAGES: Record<CDEStage, StageConfig> = {
  new: { label: 'New Submissions', color: 'text-blue-400', bgColor: 'bg-blue-900/50', description: '3-day review period' },
  reviewing: { label: 'Under Review', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50', description: 'Active due diligence' },
  loi_issued: { label: 'LOI Issued', color: 'text-purple-400', bgColor: 'bg-purple-900/50', description: 'Awaiting sponsor response' },
  committed: { label: 'Committed', color: 'text-green-400', bgColor: 'bg-green-900/50', description: 'Commitment letter signed' },
  closing: { label: 'Closing', color: 'text-indigo-400', bgColor: 'bg-indigo-900/50', description: 'In closing process' },
};

const INVESTOR_STAGES: Record<InvestorStage, StageConfig> = {
  reviewing: { label: 'Under Review', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50', description: 'Evaluating opportunity' },
  loi_issued: { label: 'LOI Issued', color: 'text-purple-400', bgColor: 'bg-purple-900/50', description: 'Intent to invest' },
  committed: { label: 'Committed', color: 'text-green-400', bgColor: 'bg-green-900/50', description: 'Investment committed' },
  closing: { label: 'Closing', color: 'text-indigo-400', bgColor: 'bg-indigo-900/50', description: 'Finalizing investment' },
};

// ============================================
// PIPELINE DEAL INTERFACE
// ============================================

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  cdeName?: string;
  investorName?: string;
  city: string;
  state: string;
  programType: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ' | 'DRAFT';
  allocationRequest: number;
  stage: PipelineStage;
  matchScore: number;
  tractType: string[];
  daysInStage: number;
  submittedDate: string;
  assignedTo?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  isDraft?: boolean;
  readinessScore?: number;
  holdExpires?: string; // 3-day hold for CDEs
}

// ============================================
// DEMO DATA BY ROLE
// ============================================

// Sponsor sees THEIR deals
const SPONSOR_DEMO_DEALS: PipelineDeal[] = [
  {
    id: 'sp-1',
    projectName: 'XS Tennis Village Phase 1',
    sponsorName: 'XS Tennis Foundation',
    cdeName: 'Midwest Community CDE',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 8500000,
    stage: 'closing',
    matchScore: 94,
    tractType: ['SD', 'QCT'],
    daysInStage: 15,
    submittedDate: '2024-10-01',
    nextAction: 'Final closing documents review',
    nextActionDate: '2024-12-22',
  },
  {
    id: 'sp-2',
    projectName: 'XS Tennis Academy Expansion',
    sponsorName: 'XS Tennis Foundation',
    cdeName: 'Enterprise Community CDE',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 12000000,
    stage: 'loi_received',
    matchScore: 91,
    tractType: ['SD'],
    daysInStage: 8,
    submittedDate: '2024-11-15',
    nextAction: 'Review LOI terms with counsel',
    nextActionDate: '2024-12-20',
  },
  {
    id: 'sp-3',
    projectName: 'XS Community Center',
    sponsorName: 'XS Tennis Foundation',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 6000000,
    stage: 'submitted',
    matchScore: 88,
    tractType: ['QCT'],
    daysInStage: 3,
    submittedDate: '2024-12-18',
    nextAction: 'Awaiting CDE response',
  },
];

// CDE sees deals submitted TO them
const CDE_DEMO_DEALS: PipelineDeal[] = [
  {
    id: 'cde-1',
    projectName: 'Chicago South Side Community Center',
    sponsorName: 'Metro Development Corp',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 15000000,
    stage: 'new',
    matchScore: 94,
    tractType: ['SD', 'QCT'],
    daysInStage: 1,
    submittedDate: '2024-12-20',
    holdExpires: '2024-12-23',
    nextAction: 'Initial review - 3 day hold',
  },
  {
    id: 'cde-2',
    projectName: 'Milwaukee Workforce Training Hub',
    sponsorName: 'Badger Community Partners',
    city: 'Milwaukee',
    state: 'WI',
    programType: 'NMTC',
    allocationRequest: 8000000,
    stage: 'reviewing',
    matchScore: 87,
    tractType: ['QCT'],
    daysInStage: 5,
    submittedDate: '2024-12-10',
    assignedTo: 'Sarah Johnson',
    nextAction: 'Site visit scheduled',
    nextActionDate: '2024-12-22',
  },
  {
    id: 'cde-3',
    projectName: 'Springfield Healthcare Clinic',
    sponsorName: 'Central IL Health Corp',
    city: 'Springfield',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 4000000,
    stage: 'loi_issued',
    matchScore: 82,
    tractType: ['LIC'],
    daysInStage: 3,
    submittedDate: '2024-12-01',
    assignedTo: 'Mike Thompson',
    nextAction: 'Awaiting sponsor acceptance',
    nextActionDate: '2024-12-25',
  },
  {
    id: 'cde-4',
    projectName: 'St. Louis Manufacturing Expansion',
    sponsorName: 'Gateway Industrial LLC',
    city: 'St. Louis',
    state: 'MO',
    programType: 'NMTC',
    allocationRequest: 12000000,
    stage: 'committed',
    matchScore: 79,
    tractType: ['SD'],
    daysInStage: 5,
    submittedDate: '2024-11-15',
    assignedTo: 'Sarah Johnson',
    nextAction: 'Schedule closing call',
    nextActionDate: '2024-12-23',
  },
  {
    id: 'cde-5',
    projectName: 'Indianapolis Charter School',
    sponsorName: 'Crossroads Education Foundation',
    city: 'Indianapolis',
    state: 'IN',
    programType: 'NMTC',
    allocationRequest: 6000000,
    stage: 'closing',
    matchScore: 91,
    tractType: ['SD', 'QCT'],
    daysInStage: 8,
    submittedDate: '2024-10-28',
    assignedTo: 'Mike Thompson',
    nextAction: 'Final document review',
    nextActionDate: '2024-12-21',
  },
];

// Investor sees deals they're considering/committed to
const INVESTOR_DEMO_DEALS: PipelineDeal[] = [
  {
    id: 'inv-1',
    projectName: 'Downtown Community Center',
    sponsorName: 'Metro Development Corp',
    cdeName: 'Enterprise Community CDE',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 15000000,
    stage: 'reviewing',
    matchScore: 94,
    tractType: ['SD', 'QCT'],
    daysInStage: 4,
    submittedDate: '2024-12-15',
    nextAction: 'Review CRA eligibility',
    nextActionDate: '2024-12-22',
  },
  {
    id: 'inv-2',
    projectName: 'Heritage Theater Restoration',
    sponsorName: 'Arts District Foundation',
    cdeName: 'US Bancorp CDE',
    city: 'Pittsburgh',
    state: 'PA',
    programType: 'HTC',
    allocationRequest: 8500000,
    stage: 'loi_issued',
    matchScore: 89,
    tractType: ['QCT'],
    daysInStage: 6,
    submittedDate: '2024-12-08',
    nextAction: 'Finalize investment terms',
    nextActionDate: '2024-12-23',
  },
  {
    id: 'inv-3',
    projectName: 'Rural Health Network',
    sponsorName: 'HealthFirst Foundation',
    cdeName: 'Capital One CDE',
    city: 'Des Moines',
    state: 'IA',
    programType: 'NMTC',
    allocationRequest: 12000000,
    stage: 'committed',
    matchScore: 92,
    tractType: ['SD'],
    daysInStage: 10,
    submittedDate: '2024-11-20',
    nextAction: 'Wire transfer scheduled',
    nextActionDate: '2024-12-24',
  },
  {
    id: 'inv-4',
    projectName: 'Workforce Training Center',
    sponsorName: 'Skills Development Corp',
    cdeName: 'JPMorgan Chase CDE',
    city: 'Detroit',
    state: 'MI',
    programType: 'NMTC',
    allocationRequest: 9000000,
    stage: 'closing',
    matchScore: 87,
    tractType: ['SD', 'QCT'],
    daysInStage: 5,
    submittedDate: '2024-11-01',
    nextAction: 'Final closing call',
    nextActionDate: '2024-12-21',
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function PipelinePage() {
  return (
    <ProtectedRoute>
      <PipelineContent />
    </ProtectedRoute>
  );
}

function PipelineContent() {
  const router = useRouter();
  const { orgType, orgName, currentDemoRole } = useCurrentUser();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [drafts, setDrafts] = useState<PipelineDeal[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  // Get role-specific configuration
  const effectiveRole = currentDemoRole === 'admin' ? 'cde' : orgType;
  
  const getStageConfig = (): Record<string, StageConfig> => {
    switch (effectiveRole) {
      case 'sponsor': return SPONSOR_STAGES;
      case 'cde': return CDE_STAGES;
      case 'investor': return INVESTOR_STAGES;
      default: return SPONSOR_STAGES;
    }
  };

  const getStages = (): PipelineStage[] => {
    switch (effectiveRole) {
      case 'sponsor': return ['draft', 'submitted', 'loi_received', 'committed', 'closing'];
      case 'cde': return ['new', 'reviewing', 'loi_issued', 'committed', 'closing'];
      case 'investor': return ['reviewing', 'loi_issued', 'committed', 'closing'];
      default: return ['draft', 'submitted', 'loi_received', 'committed', 'closing'];
    }
  };

  const getDemoDeals = (): PipelineDeal[] => {
    switch (effectiveRole) {
      case 'sponsor': return SPONSOR_DEMO_DEALS;
      case 'cde': return CDE_DEMO_DEALS;
      case 'investor': return INVESTOR_DEMO_DEALS;
      default: return SPONSOR_DEMO_DEALS;
    }
  };

  const getPageTitle = (): string => {
    switch (effectiveRole) {
      case 'sponsor': return 'My Deal Pipeline';
      case 'cde': return 'CDE Deal Pipeline';
      case 'investor': return 'Investment Pipeline';
      default: return 'Deal Pipeline';
    }
  };

  const getPageSubtitle = (): string => {
    switch (effectiveRole) {
      case 'sponsor': return 'Track your submitted deals through the financing process';
      case 'cde': return 'Manage deals submitted to your organization';
      case 'investor': return 'Track investment opportunities and commitments';
      default: return '';
    }
  };

  const stageConfig = getStageConfig();
  const stages = getStages();
  const pipeline = getDemoDeals();

  // Load drafts for sponsors only
  useEffect(() => {
    if (effectiveRole !== 'sponsor') {
      setIsLoadingDrafts(false);
      return;
    }

    const loadDrafts = async () => {
      const userEmail = localStorage.getItem('tcredex_user_email');
      if (!userEmail) {
        setIsLoadingDrafts(false);
        return;
      }

      try {
        const response = await fetch(`/api/drafts?email=${encodeURIComponent(userEmail)}`);
        const result = await response.json();
        
        if (result.draft) {
          const draftDeal: PipelineDeal = {
            id: result.draft.id,
            projectName: result.draft.project_name || 'Untitled Draft',
            sponsorName: result.draft.data?.sponsorName || 'Not specified',
            city: result.draft.data?.city || '',
            state: result.draft.data?.state || '',
            programType: 'DRAFT',
            allocationRequest: result.draft.data?.totalProjectCost || 0,
            stage: 'draft',
            matchScore: result.draft.readiness_score || 0,
            tractType: [],
            daysInStage: Math.floor((Date.now() - new Date(result.draft.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
            submittedDate: result.draft.created_at,
            isDraft: true,
            readinessScore: result.draft.readiness_score,
          };
          setDrafts([draftDeal]);
        }
      } catch (error) {
        console.error('[Pipeline] Failed to load drafts:', error);
      } finally {
        setIsLoadingDrafts(false);
      }
    };

    loadDrafts();
  }, [effectiveRole]);

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const getStageDeals = (stage: PipelineStage) => {
    if (stage === 'draft') return drafts;
    return pipeline.filter(d => d.stage === stage);
  };

  const totalPipeline = pipeline.reduce((sum, d) => sum + d.allocationRequest, 0);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleDealClick = (deal: PipelineDeal) => {
    if (deal.isDraft) {
      router.push('/intake');
    } else {
      setSelectedDeal(deal);
    }
  };

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this draft? This cannot be undone.')) return;

    try {
      await fetch(`/api/drafts?id=${draftId}`, { method: 'DELETE' });
      setDrafts([]);
    } catch (error) {
      console.error('[Pipeline] Failed to delete draft:', error);
    }
  };

  // Calculate days until hold expires (for CDE new submissions)
  const getHoldStatus = (deal: PipelineDeal) => {
    if (!deal.holdExpires) return null;
    const expires = new Date(deal.holdExpires);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (hoursLeft <= 0) return { text: 'Hold expired', color: 'text-red-400' };
    if (hoursLeft <= 24) return { text: `${hoursLeft}h left`, color: 'text-amber-400' };
    return { text: `${Math.ceil(hoursLeft / 24)}d left`, color: 'text-blue-400' };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{getPageTitle()}</h1>
          <p className="text-gray-400 mt-1">{getPageSubtitle()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {effectiveRole === 'investor' ? 'Investment Pipeline' : 'Active Pipeline'}
            </div>
            <div className="text-2xl font-bold text-indigo-400">{formatCurrency(totalPipeline)}</div>
          </div>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
          {effectiveRole === 'sponsor' && (
            <Link
              href="/intake"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Deal
            </Link>
          )}
        </div>
      </div>

      {/* Stage Legend for CDEs */}
      {effectiveRole === 'cde' && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>3-Day Hold Rule:</strong> New submissions have a 3-day review period before CDE can pass or commit.</span>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const config = stageConfig[stage];
            if (!config) return null;
            
            const stageDeals = getStageDeals(stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.allocationRequest, 0);
            const isDraftColumn = stage === 'draft';
            
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                {/* Column Header */}
                <div className={`rounded-t-lg p-3 border border-gray-800 border-b-0 ${isDraftColumn ? 'bg-gray-800/30' : 'bg-gray-900'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                      {isDraftColumn && isLoadingDrafts && (
                        <span className="ml-2 w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{stageDeals.length}</span>
                  </div>
                  {config.description && (
                    <div className="text-xs text-gray-500">{config.description}</div>
                  )}
                  {!isDraftColumn && stageTotal > 0 && (
                    <div className="text-xs text-gray-400 mt-1">{formatCurrency(stageTotal)}</div>
                  )}
                </div>
                
                {/* Cards */}
                <div className={`rounded-b-lg p-2 border border-gray-800 border-t-0 min-h-[400px] space-y-2 ${isDraftColumn ? 'bg-gray-800/20' : 'bg-gray-900/50'}`}>
                  {/* Empty draft state */}
                  {isDraftColumn && stageDeals.length === 0 && !isLoadingDrafts && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">No drafts in progress</p>
                      <Link
                        href="/intake"
                        className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Start new deal
                      </Link>
                    </div>
                  )}

                  {/* Empty non-draft state */}
                  {!isDraftColumn && stageDeals.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No deals in this stage</p>
                    </div>
                  )}

                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => handleDealClick(deal)}
                      className={`rounded-lg p-3 border cursor-pointer transition-colors ${
                        deal.isDraft 
                          ? 'bg-gray-800/50 border-dashed border-gray-600 hover:border-indigo-500' 
                          : 'bg-gray-900 border-gray-800 hover:border-indigo-500'
                      }`}
                    >
                      {deal.isDraft ? (
                        // Draft card layout
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-100 text-sm line-clamp-1">{deal.projectName}</h3>
                            <button
                              onClick={(e) => handleDeleteDraft(deal.id, e)}
                              className="text-gray-500 hover:text-red-400 p-1 -m-1"
                              title="Delete draft"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="text-indigo-400">{deal.readinessScore || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${deal.readinessScore || 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{deal.daysInStage}d ago</span>
                            <span className="text-indigo-400 font-medium flex items-center gap-1">
                              Continue
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </>
                      ) : (
                        // Regular deal card layout
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-100 text-sm line-clamp-1">{deal.projectName}</h3>
                            <span className={`text-sm font-bold ${getScoreColor(deal.matchScore)}`}>
                              {deal.matchScore}
                            </span>
                          </div>
                          
                          {/* Show different info based on role */}
                          <p className="text-xs text-gray-500 mb-2">
                            {effectiveRole === 'sponsor' && deal.cdeName && `CDE: ${deal.cdeName}`}
                            {effectiveRole === 'cde' && `Sponsor: ${deal.sponsorName}`}
                            {effectiveRole === 'investor' && deal.cdeName && `via ${deal.cdeName}`}
                          </p>
                          
                          {/* 3-day hold indicator for CDE */}
                          {effectiveRole === 'cde' && deal.stage === 'new' && deal.holdExpires && (
                            <div className="mb-2">
                              {(() => {
                                const holdStatus = getHoldStatus(deal);
                                return holdStatus && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${holdStatus.color}`}>
                                    ⏱ {holdStatus.text}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-indigo-400">
                              {formatCurrency(deal.allocationRequest)}
                            </span>
                            <div className="flex gap-1">
                              {deal.tractType.map(tract => (
                                <span
                                  key={tract}
                                  className={`px-1 py-0.5 rounded text-xs ${
                                    tract === 'SD' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'
                                  }`}
                                >
                                  {tract}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {deal.nextAction && (
                            <div className="mt-2 pt-2 border-t border-gray-800">
                              <p className="text-xs text-gray-400 line-clamp-1">{deal.nextAction}</p>
                              {deal.nextActionDate && (
                                <p className="text-xs text-amber-400 mt-0.5">
                                  Due: {new Date(deal.nextActionDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                            <span className="text-xs text-gray-500">{deal.city}, {deal.state}</span>
                            <span className="text-xs text-gray-500">{deal.daysInStage}d in stage</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  {effectiveRole === 'sponsor' ? 'CDE' : effectiveRole === 'investor' ? 'CDE' : 'Sponsor'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Next Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Days</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Drafts first (sponsors only) */}
              {effectiveRole === 'sponsor' && drafts.map(draft => (
                <tr 
                  key={draft.id} 
                  className="hover:bg-gray-800/50 cursor-pointer bg-gray-800/20"
                  onClick={() => router.push('/intake')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">DRAFT</span>
                      <span className="font-medium text-gray-100">{draft.projectName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${draft.readinessScore || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{draft.readinessScore || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{draft.daysInStage}d</td>
                  <td className="px-4 py-3">
                    <span className="text-indigo-400 hover:text-indigo-300 text-sm">Continue →</span>
                  </td>
                </tr>
              ))}
              
              {/* Active deals */}
              {pipeline.map(deal => {
                const config = stageConfig[deal.stage];
                return (
                  <tr key={deal.id} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => setSelectedDeal(deal)}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-100">{deal.projectName}</p>
                        <p className="text-sm text-gray-500">{deal.city}, {deal.state}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {effectiveRole === 'sponsor' && (deal.cdeName || '—')}
                      {effectiveRole === 'cde' && deal.sponsorName}
                      {effectiveRole === 'investor' && (deal.cdeName || '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.bgColor} ${config?.color}`}>
                        {config?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-100">{formatCurrency(deal.allocationRequest)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}>{deal.matchScore}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-300">{deal.nextAction || '—'}</p>
                      {deal.nextActionDate && (
                        <p className="text-xs text-amber-400">{new Date(deal.nextActionDate).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{deal.daysInStage}</td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-400 hover:text-indigo-300 text-sm">View →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && !selectedDeal.isDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedDeal(null)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedDeal.projectName}</h3>
                <p className="text-gray-400">
                  {effectiveRole === 'sponsor' && selectedDeal.cdeName}
                  {effectiveRole === 'cde' && selectedDeal.sponsorName}
                  {effectiveRole === 'investor' && selectedDeal.cdeName}
                </p>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    {effectiveRole === 'investor' ? 'Investment Amount' : 'Allocation'}
                  </label>
                  <p className="text-lg font-semibold text-indigo-400">{formatCurrency(selectedDeal.allocationRequest)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Match Score</label>
                  <p className={`text-lg font-semibold ${getScoreColor(selectedDeal.matchScore)}`}>{selectedDeal.matchScore}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Location</label>
                <p className="text-gray-100">{selectedDeal.city}, {selectedDeal.state}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Current Stage</label>
                <p className="text-gray-100">{stageConfig[selectedDeal.stage]?.label}</p>
              </div>

              {selectedDeal.nextAction && (
                <div>
                  <label className="text-xs text-gray-500 uppercase block mb-2">Next Action</label>
                  <p className="text-gray-100">{selectedDeal.nextAction}</p>
                  {selectedDeal.nextActionDate && (
                    <p className="text-sm text-amber-400 mt-1">
                      Due: {new Date(selectedDeal.nextActionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Link
                href={`/deals/${selectedDeal.id}`}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-center"
              >
                View Full Deal
              </Link>
              <button
                onClick={() => setSelectedDeal(null)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
