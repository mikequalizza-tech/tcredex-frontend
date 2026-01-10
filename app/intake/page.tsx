'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';
import { IntakeShell, IntakeData } from '@/components/intake-v4';
import { DealCardPreview } from '@/components/deals';
import { generateDealFromIntake, validateForDealCard, DealCardGeneratorResult } from '@/lib/deals';
import { Deal } from '@/lib/data/deals';
import { fetchDealById } from '@/lib/supabase/queries';

interface DraftInfo {
  id: string;
  project_name: string;
  updated_at: string;
  draft_data?: IntakeData;
  intake_data?: IntakeData;
  readiness_score?: number;
  status?: string;
}

// Step 2: Show draft options if draft exists
function DraftPrompt({ 
  draft, 
  email,
  onContinue, 
  onStartFresh 
}: { 
  draft: DraftInfo; 
  email: string;
  onContinue: () => void; 
  onStartFresh: () => void;
}) {
  const updatedAt = new Date(draft.updated_at);
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome back!</h2>
          <p className="text-gray-400 text-sm">You have an unfinished draft</p>
        </div>

        {/* Draft Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white">
              {draft.project_name || 'Untitled Project'}
            </h3>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              Progress: <span className="text-indigo-400">{draft.readiness_score || 0}%</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Continue Draft
          </button>
          
          <button
            onClick={onStartFresh}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors border border-gray-700"
          >
            Start Fresh (delete draft)
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Signed in as {email}
        </p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Access Denied Component
function AccessDenied({ orgType }: { orgType: string | undefined }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Sponsor Access Only</h1>
        <p className="text-gray-400 mb-6">
          Only Project Sponsors can submit deals to the marketplace. 
          {orgType === 'cde' && ' As a CDE, you can review and match with submitted deals in your Pipeline.'}
          {orgType === 'investor' && ' As an Investor, you can browse and invest in deals from the Marketplace.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link 
            href="/deals" 
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Browse Marketplace
          </Link>
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function IntakeLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Inner component that uses useSearchParams
function IntakePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams?.get('dealId') ?? null; // Edit mode for submitted deals
  const draftId = searchParams?.get('draftId') ?? null; // Continue specific draft directly (skip prompt)

  const { orgType, isLoading: authLoading, isAuthenticated, organizationId, userEmail: authEmail } = useCurrentUser();
  const [step, setStep] = useState<'loading' | 'draft-prompt' | 'form'>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [existingDraft, setExistingDraft] = useState<DraftInfo | null>(null);
  const [initialData, setInitialData] = useState<Partial<IntakeData> | undefined>(undefined);
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);

  // Preview state
  const [previewResult, setPreviewResult] = useState<DealCardGeneratorResult | null>(null);
  const [currentData, setCurrentData] = useState<IntakeData | null>(null);

  // Check for edit mode (dealId in URL)
  useEffect(() => {
    const loadDealForEdit = async () => {
      if (!dealId) return;

      try {
        const deal = await fetchDealById(dealId);

        if (!deal) {
          setEditLoadError('Deal not found');
          return;
        }

        // Verify ownership
        if (deal.sponsorOrganizationId !== organizationId) {
          setEditLoadError('You do not have permission to edit this deal');
          return;
        }

        setEditingDeal(deal);
        setIsEditMode(true);

        // Convert Deal to IntakeData format
        const intakeData: Partial<IntakeData> = {
          projectName: deal.projectName,
          projectDescription: deal.description || '',
          city: deal.city,
          state: deal.state,
          censusTract: deal.censusTract || '',
          totalProjectCost: deal.projectCost || 0,
          nmtcFinancingRequested: deal.allocation,
          communityBenefit: deal.communityImpact || '',
          // Add more field mappings as needed
        };

        setInitialData(intakeData);
        setStep('form');
      } catch (error) {
        console.error('[Intake] Failed to load deal for editing:', error);
        setEditLoadError('Failed to load deal');
      }
    };

    if (dealId && isAuthenticated && !authLoading) {
      loadDealForEdit();
    }
  }, [dealId, isAuthenticated, authLoading, organizationId]);

  // Hydrate email from authenticated user (preferred) or local fallback and fetch draft
  useEffect(() => {
    if (dealId) return; // Skip draft check in edit mode for submitted deals
    if (authLoading) return;

    const skipDraftCheck = searchParams?.get('new') === 'true'; // Skip if user explicitly wants new deal

    const hydrateAndLoadDraft = async () => {
      if (!organizationId) {
        setStep('form');
        return;
      }

      setUserEmail(authEmail || null);

      // If user explicitly wants a new deal, skip draft check
      if (skipDraftCheck) {
        setStep('form');
        return;
      }

      try {
        // If a specific draftId is provided, load that draft directly without showing prompt
        const draftQuery = draftId
          ? `/api/drafts?id=${encodeURIComponent(draftId)}`
          : `/api/drafts?orgId=${encodeURIComponent(organizationId)}`;

        const response = await fetch(draftQuery);
        const result = await response.json();

        if (result.draft) {
          setExistingDraft(result.draft);
          setInitialData(result.draft.draft_data || result.draft.intake_data);
          // If draftId was specified, go directly to form (user already chose to continue from pipeline)
          // Otherwise show the prompt so user can choose
          setStep(draftId ? 'form' : 'draft-prompt');
        } else {
          setStep('form');
        }
      } catch (error) {
        console.error('[Intake] Failed to check for draft:', error);
        setStep('form');
      }
    };

    hydrateAndLoadDraft();
  }, [authEmail, authLoading, dealId, draftId, organizationId, searchParams]);

  // Continue with existing draft
  const handleContinueDraft = () => {
    if (existingDraft?.draft_data || existingDraft?.intake_data) {
      setInitialData(existingDraft.draft_data || existingDraft.intake_data);
    }
    setStep('form');
  };

  // Start fresh (delete draft)
  const handleStartFresh = async () => {
    if (organizationId) {
      try {
        await fetch(`/api/drafts?orgId=${encodeURIComponent(organizationId)}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('[Intake] Failed to delete draft:', error);
      }
    }
    setInitialData(undefined);
    setExistingDraft(null);
    setStep('form');
  };

  // Save draft
  const handleSave = useCallback(async (data: IntakeData, readinessScore: number) => {
    if (!organizationId) {
      setSaveToast({ type: 'error', message: 'Missing organization. Please sign in again.' });
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, data, readinessScore, dealId: existingDraft?.id })
      });
      const result = await response.json();
      
      // Enhanced error logging
      console.log('[Intake] Save response:', { 
        ok: response.ok, 
        status: response.status, 
        result 
      });
      
      localStorage.setItem('tcredex_draft', JSON.stringify(data));
      
      if (!response.ok || !result?.success) {
        const errorMsg = result?.error || result?.message || `HTTP ${response.status}: Save failed`;
        console.error('[Intake] Save API error:', {
          status: response.status,
          statusText: response.statusText,
          result,
          errorMsg
        });
        throw new Error(errorMsg);
      }
      
      setSaveToast({ type: 'success', message: 'Draft saved to your account' });
      setExistingDraft(result.draft ?? existingDraft);
      setInitialData(result.draft?.draft_data || result.draft?.intake_data || data);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (error) {
      console.error('[Intake] Save failed - Full error:', error);
      console.error('[Intake] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        organizationId,
        dataKeys: Object.keys(data),
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('tcredex_draft', JSON.stringify(data));
      
      // Show more detailed error message and keep it longer
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveToast({ 
        type: 'error', 
        message: `Save failed: ${errorMessage}. Saved locally; will sync when online` 
      });
      
      // Keep error message for 8 seconds instead of 3
      setTimeout(() => setSaveToast(null), 8000);
    }
  }, [existingDraft, organizationId]);

  // Submit
  const handleSubmit = async (data: IntakeData, readinessScore: number) => {
    const validation = validateForDealCard(data);
    
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`);
      return;
    }

    const result = generateDealFromIntake(data);
    setCurrentData(data);
    setPreviewResult(result);
  };

  const handleClosePreview = () => setPreviewResult(null);
  const handleEditFromPreview = () => setPreviewResult(null);

  const handleSubmitToMarketplace = async (deal: Deal) => {
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeData: currentData,
          saveOnly: false,
          dealId: existingDraft?.id || undefined,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Clear draft
        if (organizationId) {
          await fetch(`/api/drafts?orgId=${encodeURIComponent(organizationId)}`, { method: 'DELETE' });
        }
        localStorage.removeItem('tcredex_draft');
        
        alert(`🎉 Deal "${deal.projectName}" submitted!\n\nDeal ID: ${result.dealId}`);
        setPreviewResult(null);
        router.push('/deals');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  // ========================================
  // ROLE-BASED ACCESS CONTROL
  // ========================================

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Edit mode error
  if (editLoadError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Cannot Edit Deal</h1>
          <p className="text-gray-400 mb-6">{editLoadError}</p>
          <Link
            href="/deals"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated but NOT a sponsor, block access
  // Note: We allow non-authenticated users to start the form (they'll login/register later)
  if (isAuthenticated && orgType !== 'sponsor') {
    return <AccessDenied orgType={orgType} />;
  }

  // ========================================
  // RENDER BASED ON STEP
  // ========================================

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (step === 'draft-prompt' && existingDraft) {
    return (
      <DraftPrompt
        draft={existingDraft}
        email={userEmail || 'your account'}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    );
  }

  // Form step
  return (
    <>
      {saveToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm border ${
          saveToast.type === 'success'
            ? 'bg-emerald-900/80 border-emerald-600 text-emerald-100'
            : 'bg-amber-900/80 border-amber-600 text-amber-100'
        }`}
        >
          {saveToast.message}
        </div>
      )}

      {/* Navigation Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          
          {/* tCredex Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">tC</span>
            </div>
            <span className="text-xl font-bold text-white">tCredex</span>
          </Link>
        </div>
      </div>

      {/* Edit Mode Header */}
      {isEditMode && editingDeal && (
        <div className="bg-amber-900/30 border-b border-amber-500/30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <p className="text-amber-200 font-medium">Editing: {editingDeal.projectName}</p>
                <p className="text-amber-300/70 text-xs">Project name cannot be changed after submission</p>
              </div>
            </div>
            <Link
              href={`/deals/${dealId}`}
              className="px-3 py-1.5 text-sm text-amber-200 hover:text-white border border-amber-500/50 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}

      <IntakeShell
        initialData={initialData}
        onSave={handleSave}
        onSubmit={handleSubmit}
        isEditMode={isEditMode}
        lockedProjectName={isEditMode ? editingDeal?.projectName : undefined}
      />

      {previewResult && (
        <DealCardPreview
          result={previewResult}
          onClose={handleClosePreview}
          onEdit={handleEditFromPreview}
          onSubmit={handleSubmitToMarketplace}
        />
      )}
    </>
  );
}

// Main Page - wraps content in Suspense for useSearchParams
export default function IntakePage() {
  return (
    <Suspense fallback={<IntakeLoadingFallback />}>
      <IntakePageContent />
    </Suspense>
  );
}
