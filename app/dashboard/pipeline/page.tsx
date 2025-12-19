'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';

type PipelineStage = 'draft' | 'new' | 'reviewing' | 'due_diligence' | 'approved' | 'closing' | 'closed' | 'declined';

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
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
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Drafts', color: 'text-gray-400', bgColor: 'bg-gray-800/50' },
  new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-900/50' },
  reviewing: { label: 'Under Review', color: 'text-yellow-400', bgColor: 'bg-yellow-900/50' },
  due_diligence: { label: 'Due Diligence', color: 'text-purple-400', bgColor: 'bg-purple-900/50' },
  approved: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-900/50' },
  closing: { label: 'Closing', color: 'text-indigo-400', bgColor: 'bg-indigo-900/50' },
  closed: { label: 'Closed', color: 'text-emerald-400', bgColor: 'bg-emerald-900/50' },
  declined: { label: 'Declined', color: 'text-red-400', bgColor: 'bg-red-900/50' },
};

const DEMO_PIPELINE: PipelineDeal[] = [
  {
    id: 'pipe-1',
    projectName: 'Chicago South Side Community Center',
    sponsorName: 'Metro Development Corp',
    city: 'Chicago',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 15000000,
    stage: 'new',
    matchScore: 94,
    tractType: ['SD', 'QCT'],
    daysInStage: 2,
    submittedDate: '2024-12-15',
    nextAction: 'Initial call with sponsor',
    nextActionDate: '2024-12-20',
  },
  {
    id: 'pipe-2',
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
    nextAction: 'Review financial projections',
    nextActionDate: '2024-12-18',
  },
  {
    id: 'pipe-3',
    projectName: 'Springfield Healthcare Clinic',
    sponsorName: 'Central IL Health Corp',
    city: 'Springfield',
    state: 'IL',
    programType: 'NMTC',
    allocationRequest: 4000000,
    stage: 'due_diligence',
    matchScore: 82,
    tractType: ['LIC'],
    daysInStage: 12,
    submittedDate: '2024-12-01',
    assignedTo: 'Mike Thompson',
    nextAction: 'Site visit scheduled',
    nextActionDate: '2024-12-22',
  },
  {
    id: 'pipe-4',
    projectName: 'St. Louis Manufacturing Expansion',
    sponsorName: 'Gateway Industrial LLC',
    city: 'St. Louis',
    state: 'MO',
    programType: 'NMTC',
    allocationRequest: 12000000,
    stage: 'approved',
    matchScore: 79,
    tractType: ['SD'],
    daysInStage: 3,
    submittedDate: '2024-11-15',
    assignedTo: 'Sarah Johnson',
    nextAction: 'Draft commitment letter',
    nextActionDate: '2024-12-19',
  },
  {
    id: 'pipe-5',
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
    nextAction: 'Closing call with counsel',
    nextActionDate: '2024-12-21',
  },
  {
    id: 'pipe-6',
    projectName: 'Detroit Tech Incubator',
    sponsorName: 'Motor City Ventures',
    city: 'Detroit',
    state: 'MI',
    programType: 'NMTC',
    allocationRequest: 10000000,
    stage: 'closed',
    matchScore: 88,
    tractType: ['SD', 'QCT'],
    daysInStage: 0,
    submittedDate: '2024-09-15',
    assignedTo: 'Sarah Johnson',
  },
];

export default function PipelinePage() {
  return (
    <ProtectedRoute>
      <PipelineContent />
    </ProtectedRoute>
  );
}

function PipelineContent() {
  const router = useRouter();
  const { orgName } = useCurrentUser();
  const [pipeline, setPipeline] = useState<PipelineDeal[]>(DEMO_PIPELINE);
  const [drafts, setDrafts] = useState<PipelineDeal[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  // Load drafts from database
  useEffect(() => {
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
          // Convert draft to pipeline format
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
  }, []);

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const getStageDeals = (stage: PipelineStage) => {
    if (stage === 'draft') return drafts;
    return pipeline.filter(d => d.stage === stage);
  };

  const totalPipeline = pipeline
    .filter(d => !['closed', 'declined'].includes(d.stage))
    .reduce((sum, d) => sum + d.allocationRequest, 0);

  const stages: PipelineStage[] = ['draft', 'new', 'reviewing', 'due_diligence', 'approved', 'closing'];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleDraftClick = (deal: PipelineDeal) => {
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Deal Pipeline</h1>
          <p className="text-gray-400 mt-1">{orgName || 'Midwest Community Development Entity'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Active Pipeline Value</div>
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
          <Link
            href="/intake"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            + New Deal
          </Link>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageDeals = getStageDeals(stage);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.allocationRequest, 0);
            const isDraftColumn = stage === 'draft';
            
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                {/* Column Header */}
                <div className={`rounded-t-lg p-3 border border-gray-800 border-b-0 ${isDraftColumn ? 'bg-gray-800/30' : 'bg-gray-900'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${STAGE_CONFIG[stage].color}`}>
                      {STAGE_CONFIG[stage].label}
                      {isDraftColumn && isLoadingDrafts && (
                        <span className="ml-2 w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">{stageDeals.length}</span>
                  </div>
                  {!isDraftColumn && (
                    <div className="text-xs text-gray-500">{formatCurrency(stageTotal)}</div>
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

                  {stageDeals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => handleDraftClick(deal)}
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
                          <p className="text-xs text-gray-500 mb-2">{deal.sponsorName}</p>
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
                            <span className="text-xs text-gray-500">{deal.daysInStage}d</span>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Allocation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Next Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Days</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Drafts first */}
              {drafts.map(draft => (
                <tr 
                  key={draft.id} 
                  className="hover:bg-gray-800/50 cursor-pointer bg-gray-800/20"
                  onClick={() => router.push('/intake')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">DRAFT</span>
                      <div>
                        <p className="font-medium text-gray-100">{draft.projectName}</p>
                        <p className="text-sm text-gray-500">{draft.sponsorName}</p>
                      </div>
                    </div>
                  </td>
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
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{draft.daysInStage}d</td>
                  <td className="px-4 py-3">
                    <span className="text-indigo-400 hover:text-indigo-300 text-sm">
                      Continue →
                    </span>
                  </td>
                </tr>
              ))}
              {/* Active deals */}
              {pipeline.filter(d => !['closed', 'declined'].includes(d.stage)).map(deal => (
                <tr key={deal.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-100">{deal.projectName}</p>
                      <p className="text-sm text-gray-500">{deal.sponsorName} • {deal.city}, {deal.state}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_CONFIG[deal.stage].bgColor} ${STAGE_CONFIG[deal.stage].color}`}>
                      {STAGE_CONFIG[deal.stage].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-100">{formatCurrency(deal.allocationRequest)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}>{deal.matchScore}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{deal.assignedTo || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300">{deal.nextAction || '—'}</p>
                    {deal.nextActionDate && (
                      <p className="text-xs text-amber-400">{new Date(deal.nextActionDate).toLocaleDateString()}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{deal.daysInStage}</td>
                  <td className="px-4 py-3">
                    <Link href={`/deals/${deal.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
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
                <p className="text-gray-400">{selectedDeal.sponsorName}</p>
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
                  <label className="text-xs text-gray-500 uppercase">Allocation</label>
                  <p className="text-lg font-semibold text-indigo-400">{formatCurrency(selectedDeal.allocationRequest)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Match Score</label>
                  <p className={`text-lg font-semibold ${getScoreColor(selectedDeal.matchScore)}`}>{selectedDeal.matchScore}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Stage</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
                  {stages.filter(s => s !== 'draft').map(stage => (
                    <option key={stage} value={stage} selected={stage === selectedDeal.stage}>
                      {STAGE_CONFIG[stage].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Assigned To</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
                  <option value="">Unassigned</option>
                  <option value="sarah">Sarah Johnson</option>
                  <option value="mike">Mike Thompson</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Next Action</label>
                <input
                  type="text"
                  defaultValue={selectedDeal.nextAction}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  placeholder="Add notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link
                href={`/deals/${selectedDeal.id}`}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-center"
              >
                View Deal
              </Link>
              <button
                onClick={() => setSelectedDeal(null)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
