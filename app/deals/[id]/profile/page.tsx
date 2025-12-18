'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDealById, TRACT_LABELS } from '@/lib/data/deals';

// Extended profile data generator
function generateProfileData(dealId: string) {
  const deal = getDealById(dealId);
  if (!deal) return null;
  
  const totalProjectCost = deal.allocation * 2.5;
  const financingGap = deal.allocation * 0.2;
  
  // Generate mock census tract from state and deal ID
  const stateCode = deal.state === 'IL' ? '17' : deal.state === 'WI' ? '55' : deal.state === 'MI' ? '26' : deal.state === 'MO' ? '29' : deal.state === 'IN' ? '18' : deal.state === 'AL' ? '01' : '99';
  const censusTract = `${stateCode}031${dealId.replace(/\D/g, '').padStart(6, '0').slice(0, 6)}`;
  
  return {
    // Header
    projectName: deal.projectName,
    city: deal.city,
    state: deal.state,
    
    // Stats
    parent: deal.sponsorName,
    location: `${deal.city}, ${deal.state}`,
    censusTract: censusTract,
    status: deal.tractType.includes('SD') ? 'Severely Distressed' : 
            deal.tractType.includes('QCT') ? 'Qualified Census Tract' : 'Low-Income Community',
    povertyRate: deal.povertyRate || 28.5,
    medianIncome: '41.98%', // MFI percentage
    unemployment: 8.2,
    projectCost: totalProjectCost,
    financingGap: financingGap,
    nmtcRequest: deal.allocation,
    lihtcAvail: 'N/A',
    shovelReady: 'Yes',
    completion: 'Q2 2026',
    dealId: `TC-${dealId.toUpperCase()}`,
    
    // Contact
    contactName: 'Michael Qualizza',
    contactEmail: 'Q@tcredex.com',
    
    // Content
    projectDescription: deal.description || `${deal.projectName} represents a transformative investment in the ${deal.city} community. This ${deal.programType} project will create quality jobs and provide essential services to residents of this ${deal.tractType.includes('SD') ? 'severely distressed' : 'qualified'} census tract. The development addresses critical community needs while generating measurable economic impact.`,
    
    communityImpact: deal.communityImpact || `Located in a ${deal.tractType.includes('SD') ? 'Severely Distressed Census Tract' : 'Qualified Census Tract'}, this project will bring over ${Math.floor(deal.allocation / 150000)} construction jobs and ${Math.floor(deal.allocation / 300000)} permanent roles. Annual impact includes community services for ${Math.floor(deal.allocation / 10000)}+ individuals served. The project continues to serve the greater ${deal.city} area through comprehensive community development programs.`,
    
    // Financing
    sources: [
      { name: 'Private Funding', amount: totalProjectCost * 0.6 },
      { name: 'NMTC Gap', amount: financingGap },
      { name: 'Public Capital', amount: totalProjectCost * 0.02 },
    ],
    uses: [
      { name: 'Construction', amount: totalProjectCost * 0.85 },
      { name: 'Soft Costs', amount: totalProjectCost * 0.15 },
    ],
    totalSources: totalProjectCost,
    totalUses: totalProjectCost,
  };
}

export default function ProjectProfilePage() {
  const params = useParams();
  const dealId = params.id as string;
  const profile = generateProfileData(dealId);
  const printRef = useRef<HTMLDivElement>(null);
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h1>
          <Link href="/deals" className="text-indigo-600 hover:text-indigo-500">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Actions - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={`/deals/${dealId}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deal
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Profile Document */}
      <div ref={printRef} className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-none">
        <div className="bg-white shadow-lg print:shadow-none">
          {/* Document Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {/* Placeholder for NMTC logo/badge */}
              <div className="w-24 h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-xs text-gray-500 p-1">
                <span className="text-center leading-tight">NMTC Eligible Census Tract</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              © {new Date().getFullYear()} tCredex.com
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex">
            {/* Left Sidebar - Project Stats */}
            <div className="w-80 bg-slate-800 text-white p-6 print:bg-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-600 pb-2">
                PROJECT STATS
              </h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-300">Parent:</span>
                  <span className="ml-1 text-white">{profile.parent}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Project:</span>
                  <span className="ml-1 text-white">{profile.projectName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Location:</span>
                  <span className="ml-1 text-white">{profile.location}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Census Tract:</span>
                  <span className="ml-1 text-white font-mono">{profile.censusTract}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Status:</span>
                  <span className="ml-1 text-white">{profile.status}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Poverty Rate:</span>
                  <span className="ml-1 text-white">{profile.povertyRate}%</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Median Income:</span>
                  <span className="ml-1 text-white">{profile.medianIncome}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Unemployment:</span>
                  <span className="ml-1 text-white">{profile.unemployment}%</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Project Cost:</span>
                  <span className="ml-1 text-white">{formatCurrency(profile.projectCost)}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Financing Gap:</span>
                  <span className="ml-1 text-white">{formatCurrency(profile.financingGap)}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">NMTC Request:</span>
                  <span className="ml-1 text-white">{formatCurrency(profile.nmtcRequest)}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">4% LIHTC Avail:</span>
                  <span className="ml-1 text-white">{profile.lihtcAvail}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Shovel Ready:</span>
                  <span className="ml-1 text-white">{profile.shovelReady}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Completion:</span>
                  <span className="ml-1 text-white">{profile.completion}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Deal ID:</span>
                  <span className="ml-1 text-white">{profile.dealId}</span>
                </div>
                
                {/* Contact */}
                <div className="pt-4 border-t border-slate-600 mt-4">
                  <div className="font-semibold text-cyan-400 mb-1">Contact:</div>
                  <div className="text-white">{profile.contactName}</div>
                  <a href={`mailto:${profile.contactEmail}`} className="text-cyan-300 hover:text-cyan-200">
                    {profile.contactEmail}
                  </a>
                </div>

                {/* Logo Placeholder */}
                <div className="pt-4 mt-4 flex justify-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-8">
              {/* Project Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.projectName}</h1>
              <p className="text-lg text-teal-600 mb-6">{profile.city}, {profile.state}</p>

              {/* Project Image Placeholder */}
              <div className="w-full h-64 bg-gradient-to-br from-teal-100 to-green-100 rounded-lg mb-8 flex items-center justify-center border border-gray-200 overflow-hidden">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Project Rendering</p>
                </div>
              </div>

              {/* The Project Section */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-teal-600 mb-3">The Project</h2>
                <p className="text-gray-700 leading-relaxed">
                  {profile.projectDescription}
                </p>
              </section>

              {/* Community Impact Section */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-teal-600 mb-3">Community Impact</h2>
                <p className="text-gray-700 leading-relaxed">
                  {profile.communityImpact}
                </p>
              </section>

              {/* Project Financing Section */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-teal-600 mb-4">Project Financing</h2>
                <div className="grid grid-cols-2 gap-8">
                  {/* Sources */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Sources</h3>
                    <ul className="space-y-1 text-gray-700">
                      {profile.sources.map((source, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{formatCurrency(source.amount)} {source.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-2 border-t border-gray-200 font-semibold text-gray-900">
                      Total Sources: {formatCurrency(profile.totalSources)}
                    </div>
                  </div>
                  
                  {/* Uses */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Uses</h3>
                    <ul className="space-y-1 text-gray-700">
                      {profile.uses.map((use, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{formatCurrency(use.amount)} {use.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-2 border-t border-gray-200 font-semibold text-gray-900">
                      Total Uses: {formatCurrency(profile.totalUses)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Financing Structure Button */}
              <div className="mb-8">
                <button className="px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium">
                  View Financing Structure Diagram (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} tCredex.com • <span className="text-teal-600">Smart Tools for Impact Investing</span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-slate-800 {
            background-color: #1e293b !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
