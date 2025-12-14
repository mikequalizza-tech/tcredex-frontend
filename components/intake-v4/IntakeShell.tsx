'use client';

import { useState, useCallback } from 'react';
import { ProgressRail } from './ProgressRail';
import { SectionRenderer } from './SectionRenderer';
import { ReadinessMeter } from './ReadinessMeter';
import { calculateReadiness } from '@/lib/intake';

export type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';

export interface IntakeData {
  projectName?: string;
  sponsorName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  projectDescription?: string;
  projectType?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  censusTract?: string;
  tractType?: ('QCT' | 'SD' | 'LIC' | 'DDA')[];
  programs?: ProgramType[];
  programLevel?: 'federal' | 'state';
  stateProgram?: string;
  totalProjectCost?: number;
  landCost?: number;
  constructionCost?: number;
  softCosts?: number;
  financingGap?: number;
  requestedAllocation?: number;
  siteControl?: 'Owned' | 'Under Contract' | 'LOI' | 'None';
  siteControlDate?: string;
  equityAmount?: number;
  debtAmount?: number;
  grantAmount?: number;
  otherAmount?: number;
  committedCapitalPct?: number;
  docsUploaded?: number;
  docsRequired?: number;
  entitlementsApproved?: boolean;
  entitlementsSubmitted?: boolean;
  entitlementsStarted?: boolean;
  zoningApproved?: boolean;
  constructionStartMonths?: number;
  constructionStartDate?: string;
  projectedCompletionDate?: string;
  projectedClosingDate?: string;
  qalicbGrossIncome?: number;
  qalicbTangibleProperty?: number;
  qalicbEmployeeServices?: number;
  isProhibitedBusiness?: boolean;
  leverageStructure?: 'standard' | 'self-leverage' | 'hybrid';
  historicStatus?: 'listed' | 'contributing' | 'pending' | 'none';
  part1Status?: 'approved' | 'submitted' | 'not_started';
  part2Status?: 'approved' | 'submitted' | 'not_started';
  qreAmount?: number;
  totalUnits?: number;
  affordableUnits?: number;
  amiTargets?: number[];
  lihtcType?: '9%' | '4%';
  ozInvestmentDate?: string;
  substantialImprovement?: boolean;
  holdingPeriod?: number;
  jobsCreated?: number;
  jobsRetained?: number;
  sqFootage?: number;
  communityBenefit?: string;
  [key: string]: any;
}

export interface IntakeShellProps {
  initialData?: IntakeData;
  onSave?: (data: IntakeData, readinessScore: number) => void;
  onSubmit?: (data: IntakeData, readinessScore: number) => void;
}

export function IntakeShell({ initialData, onSave, onSubmit }: IntakeShellProps) {
  const [programs, setPrograms] = useState<ProgramType[]>(initialData?.programs || []);
  const [data, setData] = useState<IntakeData>(initialData || {});
  const [activeSection, setActiveSection] = useState<string>('basics');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((newData: IntakeData) => {
    setData(newData);
    if (newData.programs) setPrograms(newData.programs);
  }, []);

  const handleProgramsChange = useCallback((newPrograms: ProgramType[]) => {
    setPrograms(newPrograms);
    setData(prev => ({ ...prev, programs: newPrograms }));
  }, []);

  const readinessScore = calculateReadiness(data);

  const handleSave = async () => {
    setIsSaving(true);
    try { onSave?.(data, readinessScore.totalScore); }
    finally { setIsSaving(false); }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try { onSubmit?.(data, readinessScore.totalScore); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-100">
                {data.projectName || 'New Project Submission'}
              </h1>
              <p className="text-sm text-gray-400">
                Intake Form v4 • {programs.length > 0 ? programs.join(', ') : 'Select programs'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || readinessScore.totalScore < 40}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit to Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          <ProgressRail 
            data={data} 
            programs={programs}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
          />
          <SectionRenderer
            programs={programs}
            data={data}
            onChange={handleChange}
            onProgramsChange={handleProgramsChange}
            activeSection={activeSection}
          />
          <ReadinessMeter 
            data={data} 
            programs={programs}
            onSave={handleSave}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}

export default IntakeShell;
