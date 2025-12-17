'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProgressRail } from './ProgressRail';
import { SectionRenderer } from './SectionRenderer';
import { ReadinessMeter } from './ReadinessMeter';

// Re-export types from the central type definition
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
}

export function IntakeShell({ initialData, onSave, onSubmit, projectId }: IntakeShellProps) {
  // Form state
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);

  // Auto-save timer ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle data changes
  const handleDataChange = useCallback((updates: Partial<IntakeData>) => {
    setData(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      return updated;
    });
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
    
    // Scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (hasChanges && onSave) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      // Set new timer for auto-save (5 seconds after last change)
      autoSaveTimer.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(data, readinessScore);
          setLastSaved(new Date());
          setHasChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, 5000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [data, hasChanges, onSave, readinessScore]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(data, readinessScore);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, readinessScore]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;
    
    setIsSaving(true);
    try {
      await onSubmit(data, readinessScore);
      setHasChanges(false);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSubmit, readinessScore]);

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

    // Observe all sections
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
            {/* Save Status */}
            <div className="text-xs text-gray-500">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Saving...
                </span>
              ) : hasChanges ? (
                <span className="text-yellow-400">Unsaved changes</span>
              ) : lastSaved ? (
                <span className="text-green-400">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
            
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

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!data.projectName || !data.censusTract || isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                data.projectName && data.censusTract && !isSaving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Generate DealCard →
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
            <div className="text-xs text-gray-500">
              {hasChanges ? 'Unsaved changes' : 'All changes saved'}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!data.projectName || !data.censusTract}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium disabled:bg-gray-700 disabled:text-gray-500"
          >
            Generate DealCard
          </button>
        </div>
      </div>
    </div>
  );
}

export default IntakeShell;
