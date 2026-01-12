'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';
import { fetchDealsByOrganization } from '@/lib/supabase/queries';
import { DealStatus } from '@/lib/data/deals';
import { scoreDealFromRecord } from '@/lib/scoring/engine';

// ============================================
// PIPELINE STAGES (CANONICAL DEAL STATUS)
// ============================================

type PipelineStage = DealStatus;

interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
}

const STAGE_CONFIG: Record<PipelineStage, StageConfig> = {
  draft: { label: 'Draft', color: 'text-gray-300', bgColor: 'bg-gray-800/50' },
  submitted: { label: 'Submitted', color: 'text-blue-300', bgColor: 'bg-blue-900/50' },
  under_review: { label: 'Under Review', color: 'text-amber-300', bgColor: 'bg-amber-900/50' },
  available: { label: 'Available', color: 'text-teal-300', bgColor: 'bg-teal-900/50' },
  seeking_capital: { label: 'Seeking Capital', color: 'text-indigo-300', bgColor: 'bg-indigo-900/50' },
  matched: { label: 'Matched', color: 'text-purple-300', bgColor: 'bg-purple-900/50' },
  closing: { label: 'Closing', color: 'text-pink-300', bgColor: 'bg-pink-900/50' },
  closed: { label: 'Closed', color: 'text-green-300', bgColor: 'bg-green-900/50' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-400', bgColor: 'bg-gray-900/50' },
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
  tCredexScore?: number; // New 4-pillar score
  tier?: 1 | 2 | 3; // Greenlight, Watchlist, Defer
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
  const { orgType, currentDemoRole, organizationId, userEmail } = useCurrentUser();
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [drafts, setDrafts] = useState<PipelineDeal[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [supabaseDeals, setSupabaseDeals] = useState<PipelineDeal[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // Match score tuning constants
  const MATCH_MAX_SCORE = 99;
  const MATCH_BASELINE_SCORE = 70;
  const MATCH_POVERTY_FLOOR = 20;
  const MATCH_ALLOCATION_DIVISOR = 1_000_000;
  const MATCH_POVERTY_WEIGHT = 0.3;
  const MATCH_POVERTY_CAP = 15;
  const MATCH_ALLOCATION_WEIGHT = 1;
  const MATCH_ALLOCATION_CAP = 20;

  // Get role-specific configuration
  const effectiveRole = currentDemoRole === 'admin' ? 'cde' : orgType;

  const mapStatusToStage = (status: DealStatus | undefined): PipelineStage => status || 'draft';

  useEffect(() => {
    async function loadSupabaseDeals() {
      setIsLoadingSupabase(true);
      try {
        // Fetch deals - the query function handles null/undefined orgId gracefully
        const fetched = await fetchDealsByOrganization(organizationId || '', userEmail);

        const mapped: PipelineDeal[] = fetched.map(d => {
          // Calculate tCredex Score
          let tCredexScore = undefined;
          let tier = undefined;
          try {
            const scoreResult = scoreDealFromRecord({
              census_tract: d.censusTract,
              tract_poverty_rate: d.povertyRate,
              tract_median_income: d.medianIncome,
              tract_unemployment: d.unemployment,
              total_project_cost: d.projectCost,
              nmtc_financing_requested: d.allocation,
              jobs_created: d.jobsCreated,
              site_control: 'under_contract',
              pro_forma_complete: true,
              third_party_reports: true,
              committed_capital_pct: 70,
              projected_completion_date: new Date().toISOString(),
              project_type: d.programType,
              target_sectors: [d.programType],
            });
            tCredexScore = scoreResult.totalScore;
            tier = scoreResult.tier;
          } catch (error) {
            console.error('Error calculating tCredex score for deal:', d.id, error);
          }

          return {
            id: d.id,
            projectName: d.projectName,
            sponsorName: d.sponsorName,
            city: d.city,
            state: d.state,
            programType: d.programType as any,
            allocationRequest: d.allocation,
            stage: mapStatusToStage(d.status as DealStatus),
            matchScore: (() => {
              const povertyComponent = Math.min(
                MATCH_POVERTY_CAP,
                Math.round((d.povertyRate || MATCH_POVERTY_FLOOR) * MATCH_POVERTY_WEIGHT),
              );
              const allocationComponent = Math.min(
                MATCH_ALLOCATION_CAP,
                Math.floor(((d.allocation || 0) / MATCH_ALLOCATION_DIVISOR) * MATCH_ALLOCATION_WEIGHT),
              );
              const base = MATCH_BASELINE_SCORE + povertyComponent + allocationComponent;
              return Math.min(MATCH_MAX_SCORE, base);
            })(),
            tCredexScore,
            tier,
            tractType: d.tractType,
            daysInStage: Math.max(1, Math.floor((Date.now() - new Date(d.submittedDate).getTime()) / (1000 * 60 * 60 * 24))),
            submittedDate: d.submittedDate,
            nextAction: d.status === 'matched' ? 'Finalize LOI terms' : 'Review submission',
          };
        });
        setSupabaseDeals(mapped);
      } catch (error) {
        console.error('Failed to load deals from Supabase:', error);
      } finally {
        setIsLoadingSupabase(false);
      }
    }
    loadSupabaseDeals();
  }, [effectiveRole, organizationId, userEmail]);

  const getStageConfig = (): Record<PipelineStage, StageConfig> => STAGE_CONFIG;

  const getPageTitle = (): string => 'Deal Pipeline';

  const getPageSubtitle = (): string => 'Track deals across canonical stages';

  const stageConfig = useMemo(() => getStageConfig(), []);
  const pipeline = useMemo(() => {
    if (effectiveRole === 'sponsor') {
      return [...drafts, ...supabaseDeals];
    }
    return supabaseDeals;
  }, [drafts, supabaseDeals, effectiveRole]);

  // Load drafts for sponsors only
  useEffect(() => {
    if (effectiveRole !== 'sponsor') {
      setIsLoadingDrafts(false);
      return;
    }

    const loadDrafts = async () => {
      if (!organizationId) {
        setIsLoadingDrafts(false);
        return;
      }

      try {
        const response = await fetch(`/api/drafts?orgId=${encodeURIComponent(organizationId)}`);
        const result = await response.json();

        if (result.draft) {
          const draftDeal: PipelineDeal = {
            id: result.draft.id,
            projectName: result.draft.project_name || 'Untitled Draft',
            sponsorName: result.draft.draft_data?.sponsorName || result.draft.intake_data?.sponsorName || 'Not specified',
            city: result.draft.draft_data?.city || result.draft.intake_data?.city || '',
            state: result.draft.draft_data?.state || result.draft.intake_data?.state || '',
            programType: 'DRAFT',
            allocationRequest: result.draft.draft_data?.totalProjectCost || result.draft.intake_data?.totalProjectCost || 0,
            stage: 'draft',
            matchScore: result.draft.readiness_score || 0,
            tractType: [],
            daysInStage: Math.floor((Date.now() - new Date(result.draft.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
            submittedDate: result.draft.created_at,
            isDraft: true,
            readinessScore: result.draft.readiness_score,
          };
          setDrafts([draftDeal]);
        } else {
          setDrafts([]);
        }
      } catch (error) {
        console.error('[Pipeline] Failed to load drafts:', error);
      } finally {
        setIsLoadingDrafts(false);
      }
    };

    loadDrafts();
  }, [effectiveRole, organizationId]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const totalPipeline = supabaseDeals.reduce((sum, d) => sum + d.allocationRequest, 0);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTierColor = (tier: number | undefined) => {
    switch (tier) {
      case 1: return 'text-green-400 bg-green-900/30 border-green-700/50';
      case 2: return 'text-amber-400 bg-amber-900/30 border-amber-700/50';
      case 3: return 'text-red-400 bg-red-900/30 border-red-700/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700/50';
    }
  };

  const getTierLabel = (tier: number | undefined) => {
    switch (tier) {
      case 1: return 'Greenlight';
      case 2: return 'Watchlist';
      case 3: return 'Defer';
      default: return 'Unscored';
    }
  };

  const handleDealClick = (deal: PipelineDeal) => {
    if (deal.isDraft) {
      // Draft deal - go to intake to continue
      router.push(`/intake?draftId=${deal.id}`);
    } else if (effectiveRole === 'sponsor') {
      // Sponsor clicking their own deal - go to deal detail page (they can edit from there)
      router.push(`/deals/${deal.id}`);
    } else {
      // CDE/Investor - show detail modal
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

  const getHoldStatus = () => null;

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
          <div className="px-3 py-1.5 rounded text-sm font-medium text-gray-300 border border-gray-700">List View</div>
          {effectiveRole === 'sponsor' && (
            <Link
              href="/deals/new"
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

      {isLoadingSupabase && isLoadingDrafts ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : null}

      {/* List View */}
      {!isLoadingSupabase && !isLoadingDrafts && (
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">tCredex Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Next Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Days</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Drafts first (sponsors only) */}
              {effectiveRole === 'sponsor' && drafts.map(draft => (
                <tr
                  key={`draft-${draft.id}`}
                  className="hover:bg-gray-800/50 cursor-pointer bg-gray-800/20"
                  onClick={() => router.push(`/intake?draftId=${draft.id}`)}
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
                  <td className="px-4 py-3 text-gray-500">—</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{draft.daysInStage}d</td>
                  <td className="px-4 py-3">
                    <span className="text-indigo-400 hover:text-indigo-300 text-sm">Continue →</span>
                  </td>
                </tr>
              ))}

              {/* Active deals - deduplicate by ID */}
              {supabaseDeals
                .filter(deal => !deal.isDraft)
                .filter((deal, index, arr) => arr.findIndex(d => d.id === deal.id) === index)
                .map(deal => {
                const config = stageConfig[deal.stage];
                return (
                  <tr key={`deal-${deal.id}`} className="hover:bg-gray-800/50 cursor-pointer" onClick={() => handleDealClick(deal)}>
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
                      {deal.tCredexScore ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(deal.tCredexScore)}`}>
                            {deal.tCredexScore}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded border ${getTierColor(deal.tier)}`}>
                            {getTierLabel(deal.tier)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getScoreColor(deal.matchScore)}`}>{deal.matchScore}</span>
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
