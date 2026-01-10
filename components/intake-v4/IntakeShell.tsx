'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProgressRail } from './ProgressRail';
import { SectionRenderer } from './SectionRenderer';
import { ReadinessMeter } from './ReadinessMeter';

export type { 
  ProgramType, 
  IntakeData, 
  UploadedDocument, 
  DocumentCategory,
  ProjectImage,
  FinancingSource,
  TeamMember 
} from '@/types/intake';

import { ProgramType, IntakeData } from '@/types/intake';

interface IntakeShellProps {
  initialData?: Partial<IntakeData>;
  onSave?: (data: IntakeData, readinessScore: number) => Promise<void>;
  onSubmit?: (data: IntakeData, readinessScore: number) => Promise<void>;
  projectId?: string;
  isEditMode?: boolean;
  lockedProjectName?: string;
}

export function IntakeShell({ initialData, onSave, onSubmit, projectId, isEditMode, lockedProjectName }: IntakeShellProps) {
  const [data, setData] = useState<IntakeData>(() => ({
    programs: [],
    documents: [],
    projectImages: [],
    financingSources: [],
    projectTeam: [],
    ...initialData,
  }));
  
  const [programs, setPrograms] = useState<ProgramType[]>(initialData?.programs || []);
  const [activeSection, setActiveSection] = useState('basics');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Sync initialData when it arrives (for draft loading)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(prev => ({
        ...prev,
        ...initialData,
      }));
      if (initialData.programs) {
        setPrograms(initialData.programs);
      }
    }
  }, [initialData]);

  // Handle data changes
  const handleDataChange = useCallback((updates: Partial<IntakeData>) => {
    setData(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    setHasChanges(true);
  }, []);

  // Handle program changes
  const handleProgramsChange = useCallback((newPrograms: ProgramType[]) => {
    setPrograms(newPrograms);
    setData(prev => ({ ...prev, programs: newPrograms }));
    setHasChanges(true);
  }, []);

  // Handle section navigation
  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // NO AUTO-SAVE. Only save when user clicks button or leaves page.
  
  // Save on page leave (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasChanges && onSave) {
        // Fire and forget - can't await in beforeunload
        onSave(data, readinessScore);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, hasChanges, onSave, readinessScore]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(data, readinessScore);
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, readinessScore]);

  // Show agreement modal before submit
  const handleSubmitClick = useCallback(() => {
    setShowAgreementModal(true);
    setAgreementChecked(false);
  }, []);

  // Final submit after agreement
  const handleFinalSubmit = useCallback(async () => {
    if (!onSubmit || !agreementChecked) return;
    
    setIsSaving(true);
    try {
      const submissionData: IntakeData = {
        ...data,
        exclusivityAgreed: true,
        exclusivityAgreedAt: new Date().toISOString(),
        termsAgreed: true,
        termsAgreedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };
      await onSubmit(submissionData, readinessScore);
      setHasChanges(false);
      setShowAgreementModal(false);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSubmit, readinessScore, agreementChecked]);

  // Intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.3], rootMargin: '-100px 0px -50% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-100">
              {data.projectName || 'New Project Intake'}
            </h1>
            {projectId && (
              <span className="text-xs text-gray-500 font-mono">#{projectId}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Save indicator - minimal */}
            {hasChanges && (
              <span className="text-xs text-yellow-400">●</span>
            )}
            
            {/* Manual Save Button */}
            {onSave && (
              <button
                onClick={handleManualSave}
                disabled={isSaving || !hasChanges}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  hasChanges && !isSaving
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
            )}

            {/* Submit Button - Opens Agreement Modal */}
            <button
              onClick={handleSubmitClick}
              disabled={!data.projectName || !data.censusTract || isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.projectName && data.censusTract && !isSaving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Deal →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Rail - Progress Navigation */}
          <aside className="col-span-3 lg:col-span-2">
            <ProgressRail
              data={data}
              programs={programs}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </aside>

          {/* Center - Form Sections */}
          <div className="col-span-6 lg:col-span-7">
            <SectionRenderer
              programs={programs}
              data={data}
              onChange={handleDataChange}
              onProgramsChange={handleProgramsChange}
              activeSection={activeSection}
            />
          </div>

          {/* Right Rail - Readiness Meter */}
          <aside className="col-span-3">
            <ReadinessMeter
              data={data}
              programs={programs}
              onScoreChange={setReadinessScore}
            />
          </aside>
        </div>
      </main>

      {/* Bottom Action Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 p-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-300">
              {data.projectName || 'Untitled Project'}
            </div>
          </div>
          <button
            onClick={handleSubmitClick}
            disabled={!data.projectName || !data.censusTract}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:bg-gray-700 disabled:text-gray-500"
          >
            Submit Deal
          </button>
        </div>
      </div>

      {/* Exclusivity Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-gray-100">Platform Terms & Deal Agreement</h2>
              <p className="text-sm text-gray-400 mt-1">Please review and accept before submitting your project</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Deal Exclusivity Agreement */}
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-amber-200">Deal Exclusivity & Fee Agreement</h3>
                    <p className="text-sm text-amber-100/80 mt-1">This is an important commitment. Please read carefully.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-300">
                <p>
                  By submitting this project to the tCredex marketplace, you ("Sponsor") agree to the following terms:
                </p>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">1. Platform Engagement Fee</h4>
                  <p className="text-gray-400">
                    If your project receives a CDE allocation commitment, term sheet, or investor capital introduction 
                    through the tCredex platform while your deal is listed, a platform fee will be due at closing 
                    regardless of how the final transaction is ultimately structured or closed.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">2. Attribution Period</h4>
                  <p className="text-gray-400">
                    This fee obligation applies to any allocation or investment received from CDEs or investors 
                    with whom you were connected through tCredex during the listing period, even if the deal 
                    closes after you remove your listing from the platform. The attribution period extends 
                    for 12 months after your last active listing date.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">3. No Circumvention</h4>
                  <p className="text-gray-400">
                    You agree not to circumvent the platform by engaging directly with CDEs or investors 
                    introduced through tCredex outside of the platform for the purpose of avoiding platform fees.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">4. CDE & Investor Independence</h4>
                  <p className="text-gray-400">
                    <span className="text-green-400">Note:</span> CDEs and Investors are not bound by exclusivity 
                    terms with tCredex. Only Sponsors submitting projects agree to the deal attribution terms above.
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-gray-200 mb-2">5. Fee Calculation</h4>
                  <p className="text-gray-400">
                    Platform fees are calculated based on the allocation amount and deal structure. 
                    Current fee schedules are available on our <a href="/pricing" className="text-indigo-400 hover:text-indigo-300 underline">Pricing page</a>.
                  </p>
                </div>

                <p className="text-gray-500 text-xs">
                  This agreement is governed by the laws of the State of Illinois. For questions, 
                  contact <a href="mailto:legal@tcredex.com" className="text-indigo-400 hover:text-indigo-300">legal@tcredex.com</a>.
                </p>
              </div>

              {/* Agreement Checkbox */}
              <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-200">
                    I have read and agree to the tCredex Platform Terms and Deal Exclusivity Agreement. 
                    I understand that platform fees apply to deals closed through connections made on this platform.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowAgreementModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 text-gray-200 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!agreementChecked || isSaving}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  agreementChecked && !isSaving
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Submitting...' : 'I Agree & Submit Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntakeShell;
