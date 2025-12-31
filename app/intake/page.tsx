'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth';
import { IntakeShell, IntakeData } from '@/components/intake-v4';
import { DealCardPreview } from '@/components/deals';
import { generateDealFromIntake, validateForDealCard, DealCardGeneratorResult } from '@/lib/deals';
import { Deal } from '@/lib/data/deals';

interface DraftInfo {
  id: string;
  project_name: string;
  updated_at: string;
  data: IntakeData;
  readiness_score: number;
}

// Step 1: Ask for email
function EmailStep({ onSubmit, savedEmail }: { onSubmit: (email: string) => void; savedEmail: string | null }) {
  const [email, setEmail] = useState(savedEmail || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      localStorage.setItem('tcredex_user_email', email.toLowerCase());
      onSubmit(email.toLowerCase());
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-2">Let&apos;s save your work</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter your email so you can continue from any device.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoFocus
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none mb-4"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
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

// Main Page
export default function IntakePage() {
  const router = useRouter();
  const { orgType, isLoading: authLoading, isAuthenticated } = useCurrentUser();
  const [step, setStep] = useState<'loading' | 'email' | 'draft-prompt' | 'form'>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [existingDraft, setExistingDraft] = useState<DraftInfo | null>(null);
  const [initialData, setInitialData] = useState<Partial<IntakeData> | undefined>(undefined);
  
  // Preview state
  const [previewResult, setPreviewResult] = useState<DealCardGeneratorResult | null>(null);
  const [currentData, setCurrentData] = useState<IntakeData | null>(null);

  // Check for saved email and draft on mount
  useEffect(() => {
    const checkForDraft = async () => {
      const savedEmail = localStorage.getItem('tcredex_user_email');
      
      if (!savedEmail) {
        setStep('email');
        return;
      }

      setUserEmail(savedEmail);

      // Check for existing draft
      try {
        const response = await fetch(`/api/drafts?email=${encodeURIComponent(savedEmail)}`);
        const result = await response.json();
        
        if (result.draft) {
          setExistingDraft(result.draft);
          setStep('draft-prompt');
        } else {
          setStep('form');
        }
      } catch (error) {
        console.error('[Intake] Failed to check for draft:', error);
        setStep('form');
      }
    };

    checkForDraft();
  }, []);

  // Handle email submit
  const handleEmailSubmit = async (email: string) => {
    setUserEmail(email);

    // Check for existing draft
    try {
      const response = await fetch(`/api/drafts?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      
      if (result.draft) {
        setExistingDraft(result.draft);
        setStep('draft-prompt');
      } else {
        setStep('form');
      }
    } catch {
      setStep('form');
    }
  };

  // Continue with existing draft
  const handleContinueDraft = () => {
    if (existingDraft?.data) {
      setInitialData(existingDraft.data);
    }
    setStep('form');
  };

  // Start fresh (delete draft)
  const handleStartFresh = async () => {
    if (userEmail) {
      try {
        await fetch(`/api/drafts?email=${encodeURIComponent(userEmail)}`, {
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
    if (!userEmail) return;

    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, data, readinessScore })
      });
      // Also backup to localStorage
      localStorage.setItem('tcredex_draft', JSON.stringify(data));
    } catch (error) {
      console.error('[Intake] Save failed:', error);
      localStorage.setItem('tcredex_draft', JSON.stringify(data));
    }
  }, [userEmail]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeData: currentData,
          saveOnly: false
        })
      });

      const result = await response.json();

      if (result.success) {
        // Clear draft
        if (userEmail) {
          await fetch(`/api/drafts?email=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
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

  if (step === 'email') {
    return <EmailStep onSubmit={handleEmailSubmit} savedEmail={null} />;
  }

  if (step === 'draft-prompt' && existingDraft && userEmail) {
    return (
      <DraftPrompt
        draft={existingDraft}
        email={userEmail}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    );
  }

  // Form step
  return (
    <>
      <IntakeShell
        initialData={initialData}
        onSave={handleSave}
        onSubmit={handleSubmit}
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
