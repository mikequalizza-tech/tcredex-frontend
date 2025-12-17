'use client';

import { ProgramType, IntakeData } from './IntakeShell';
import { ProjectBasics } from './sections/ProjectBasics';
import { SponsorDetails } from './sections/SponsorDetails';
import { LocationTract } from './sections/LocationTract';
import { ProgramSelector } from './sections/ProgramSelector';
import { SocialImpact } from './sections/SocialImpact';
import { EconomicBenefits } from './sections/EconomicBenefits';
import { ProjectTeam } from './sections/ProjectTeam';
import { ProjectCosts } from './sections/ProjectCosts';
import { CapitalStack } from './sections/CapitalStack';
import { SiteControl } from './sections/SiteControl';
import { Timeline } from './sections/Timeline';
import { ProjectReadiness } from './sections/ProjectReadiness';
import { NMTC_QALICB } from './sections/NMTC_QALICB';
import { HTC_Details } from './sections/HTC_Details';
import { LIHTC_Housing } from './sections/LIHTC_Housing';
import { OZ_Details } from './sections/OZ_Details';
import { DueDiligenceDocs } from './sections/DueDiligenceDocs';

interface SectionRendererProps {
  programs: ProgramType[];
  data: IntakeData;
  onChange: (data: Partial<IntakeData>) => void;
  onProgramsChange: (programs: ProgramType[]) => void;
  activeSection?: string;
}

export function SectionRenderer({ programs, data, onChange, onProgramsChange, activeSection }: SectionRendererProps) {
  return (
    <div className="space-y-6">
      {/* PART A: PROJECT INFORMATION */}
      
      {/* Section 1 & 2: Basics + Sponsor */}
      <SectionWrapper id="basics" title="Project Basics" activeSection={activeSection}>
        <ProjectBasics data={data} onChange={onChange} />
      </SectionWrapper>

      <SectionWrapper id="sponsor" title="Sponsor Details" activeSection={activeSection}>
        <SponsorDetails data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Section 3: Location */}
      <SectionWrapper id="location" title="Location & Census Tract" activeSection={activeSection}>
        <LocationTract data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Programs Selection */}
      <SectionWrapper id="programs" title="Programs Selected" activeSection={activeSection}>
        <ProgramSelector 
          programs={programs} 
          onChange={onProgramsChange}
          programLevel={data.programLevel}
          onLevelChange={(level) => onChange({ programLevel: level })}
        />
      </SectionWrapper>

      {/* Section 5: Social Impact */}
      <SectionWrapper id="impact" title="Social Investment Criteria" activeSection={activeSection}>
        <SocialImpact data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Section 6: Economic Benefits */}
      <SectionWrapper id="benefits" title="Economic & Social Benefits" activeSection={activeSection}>
        <EconomicBenefits data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Section 7: Project Team */}
      <SectionWrapper id="team" title="Project Team" activeSection={activeSection}>
        <ProjectTeam data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Section 8: Financing */}
      <SectionWrapper id="costs" title="Project Costs & Financing Gap" activeSection={activeSection}>
        <ProjectCosts data={data} onChange={onChange} />
      </SectionWrapper>

      <SectionWrapper id="capital" title="Capital Stack" activeSection={activeSection}>
        <CapitalStack data={data} onChange={onChange} />
      </SectionWrapper>

      {/* Section 9: Readiness */}
      <SectionWrapper id="site" title="Site Control" activeSection={activeSection}>
        <SiteControl data={data} onChange={onChange} />
      </SectionWrapper>

      <SectionWrapper id="timeline" title="Timeline" activeSection={activeSection}>
        <Timeline data={data} onChange={onChange} />
      </SectionWrapper>

      <SectionWrapper id="readiness" title="Due Diligence Status" activeSection={activeSection}>
        <ProjectReadiness data={data} onChange={onChange} />
      </SectionWrapper>

      {/* PART B: PROGRAM-SPECIFIC SECTIONS */}
      
      {programs.includes('NMTC') && (
        <SectionWrapper id="nmtc_qalicb" title="QALICB Eligibility Tests" activeSection={activeSection} program="NMTC">
          <NMTC_QALICB data={data} onChange={onChange} />
        </SectionWrapper>
      )}

      {programs.includes('HTC') && (
        <SectionWrapper id="htc_status" title="Historic Tax Credit Details" activeSection={activeSection} program="HTC">
          <HTC_Details data={data} onChange={onChange} />
        </SectionWrapper>
      )}

      {programs.includes('LIHTC') && (
        <SectionWrapper id="lihtc_housing" title="LIHTC Housing Metrics" activeSection={activeSection} program="LIHTC">
          <LIHTC_Housing data={data} onChange={onChange} />
        </SectionWrapper>
      )}

      {programs.includes('OZ') && (
        <SectionWrapper id="oz_eligibility" title="Opportunity Zone Details" activeSection={activeSection} program="OZ">
          <OZ_Details data={data} onChange={onChange} />
        </SectionWrapper>
      )}

      {/* DOCUMENTS SECTION (Always visible) */}
      <SectionWrapper id="documents" title="Due Diligence Documents" activeSection={activeSection}>
        <DueDiligenceDocs data={data} onChange={onChange} />
      </SectionWrapper>
    </div>
  );
}

interface SectionWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  activeSection?: string;
  program?: ProgramType;
}

function SectionWrapper({ id, title, children, activeSection, program }: SectionWrapperProps) {
  const isActive = activeSection === id;
  
  return (
    <section 
      id={id}
      className={`bg-gray-900 rounded-xl border transition-all duration-200 ${
        isActive ? 'border-indigo-500 ring-2 ring-indigo-900' : 'border-gray-800'
      }`}
    >
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        {program && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            program === 'NMTC' ? 'bg-emerald-900/50 text-emerald-400' :
            program === 'HTC' ? 'bg-blue-900/50 text-blue-400' :
            program === 'LIHTC' ? 'bg-purple-900/50 text-purple-400' :
            'bg-amber-900/50 text-amber-400'
          }`}>
            {program} Required
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default SectionRenderer;
