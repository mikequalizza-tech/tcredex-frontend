'use client';

import { ProgramType, IntakeData } from './IntakeShell';

interface Section {
  id: string;
  label: string;
  required: boolean;
  program?: ProgramType;
  isComplete: (data: IntakeData) => boolean;
}

const BASE_SECTIONS: Section[] = [
  { id: 'basics', label: 'Project Basics', required: true, isComplete: (data) => !!(data.projectName && data.sponsorName && data.projectType) },
  { id: 'location', label: 'Location & Census Tract', required: true, isComplete: (data) => !!(data.address && data.city && data.state && data.censusTract) },
  { id: 'programs', label: 'Programs Selected', required: true, isComplete: (data) => !!(data.programs && data.programs.length > 0) },
  { id: 'costs', label: 'Project Costs & Gap', required: true, isComplete: (data) => !!(data.totalProjectCost && data.financingGap !== undefined) },
  { id: 'capital', label: 'Capital Stack', required: true, isComplete: (data) => data.committedCapitalPct !== undefined && data.committedCapitalPct > 0 },
  { id: 'site', label: 'Site Control', required: true, isComplete: (data) => !!data.siteControl },
  { id: 'timeline', label: 'Timeline', required: true, isComplete: (data) => !!data.constructionStartDate },
];

const PROGRAM_SECTIONS: Section[] = [
  { id: 'nmtc_qalicb', label: 'QALICB Tests', required: true, program: 'NMTC', isComplete: (data) => data.qalicbGrossIncome !== undefined && data.isProhibitedBusiness !== undefined },
  { id: 'nmtc_leverage', label: 'Leverage Structure', required: false, program: 'NMTC', isComplete: (data) => !!data.leverageStructure },
  { id: 'htc_status', label: 'Historic Status', required: true, program: 'HTC', isComplete: (data) => !!data.historicStatus && data.historicStatus !== 'none' },
  { id: 'htc_qre', label: 'QRE & Part 1/2', required: true, program: 'HTC', isComplete: (data) => data.qreAmount !== undefined && !!data.part1Status },
  { id: 'lihtc_housing', label: 'Housing Metrics', required: true, program: 'LIHTC', isComplete: (data) => data.totalUnits !== undefined && data.affordableUnits !== undefined },
  { id: 'lihtc_income', label: 'Income Targeting', required: true, program: 'LIHTC', isComplete: (data) => !!(data.amiTargets && data.amiTargets.length > 0) },
  { id: 'oz_eligibility', label: 'OZ Eligibility', required: true, program: 'OZ', isComplete: (data) => !!data.ozInvestmentDate },
];

interface ProgressRailProps {
  data: IntakeData;
  programs: ProgramType[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function ProgressRail({ data, programs, activeSection, onSectionClick }: ProgressRailProps) {
  const applicableSections = [...BASE_SECTIONS, ...PROGRAM_SECTIONS.filter(s => s.program && programs.includes(s.program))];
  const requiredSections = applicableSections.filter(s => s.required);
  const completedRequired = requiredSections.filter(s => s.isComplete(data));
  const progressPct = requiredSections.length > 0 ? Math.round((completedRequired.length / requiredSections.length) * 100) : 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sticky top-24 h-fit">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Form Progress</span>
          <span className="text-sm font-bold text-indigo-400">{progressPct}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {completedRequired.length} of {requiredSections.length} required sections complete
        </p>
      </div>

      {/* Section Navigation */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Base Sections</div>
        {BASE_SECTIONS.map((section) => {
          const isComplete = section.isComplete(data);
          const isActive = activeSection === section.id;
          return (
            <button key={section.id} onClick={() => onSectionClick(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-900/50 text-indigo-300 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isComplete ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {isComplete ? '✓' : section.required ? '*' : '○'}
              </span>
              <span className="flex-1 text-left">{section.label}</span>
            </button>
          );
        })}

        {programs.length > 0 && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Program Requirements</div>
            {PROGRAM_SECTIONS.filter(s => s.program && programs.includes(s.program)).map((section) => {
              const isComplete = section.isComplete(data);
              const isActive = activeSection === section.id;
              return (
                <button key={section.id} onClick={() => onSectionClick(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-900/50 text-indigo-300 font-medium' : 'text-gray-400 hover:bg-gray-800'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isComplete ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    {isComplete ? '✓' : section.required ? '*' : '○'}
                  </span>
                  <span className="flex-1 text-left">{section.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    section.program === 'NMTC' ? 'bg-emerald-900/50 text-emerald-400' :
                    section.program === 'HTC' ? 'bg-blue-900/50 text-blue-400' :
                    section.program === 'LIHTC' ? 'bg-purple-900/50 text-purple-400' :
                    'bg-amber-900/50 text-amber-400'
                  }`}>{section.program}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px]">✓</span>
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">*</span>
            <span>Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">○</span>
            <span>Optional</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressRail;
