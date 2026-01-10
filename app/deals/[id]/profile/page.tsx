'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { fetchDealById } from '@/lib/supabase/queries';
import { Deal } from '@/lib/data/deals';
import { ProjectImage } from '@/types/intake';

// Extended profile data generator
function generateProfileData(deal: Deal) {
  const totalProjectCost = deal.projectCost || deal.allocation * 2.5;
  const financingGap = deal.financingGap || deal.allocation * 0.2;
  const tractTypes = deal.tractType || [];

  // Use real census tract if available, otherwise generate mock
  let censusTract = deal.censusTract;
  if (!censusTract) {
    const stateCode = deal.state === 'IL' ? '17' : deal.state === 'WI' ? '55' : deal.state === 'MI' ? '26' : deal.state === 'MO' ? '29' : deal.state === 'IN' ? '18' : deal.state === 'AL' ? '01' : '99';
    censusTract = `${stateCode}031${deal.id.replace(/\D/g, '').padStart(6, '0').slice(0, 6)}`;
  }

  // Calculate sources total
  const sources = deal.sources && deal.sources.length > 0
    ? deal.sources
    : [
        { name: 'Private Funding', amount: totalProjectCost * 0.8 },
        { name: 'NMTC Gap', amount: financingGap },
        { name: 'Public Capital Raise', amount: totalProjectCost * 0.02 },
      ];

  const uses = deal.uses && deal.uses.length > 0
    ? deal.uses
    : deal.useOfFunds && deal.useOfFunds.length > 0
      ? deal.useOfFunds.map(u => ({ name: u.category, amount: u.amount }))
      : [
          { name: 'Expansion Construction', amount: totalProjectCost * 0.9 },
          { name: 'Soft Costs', amount: totalProjectCost * 0.1 },
        ];

  const projectImages: ProjectImage[] = deal.projectImages?.length
    ? deal.projectImages
    : deal.heroImageUrl
      ? [{ id: 'hero', name: `${deal.projectName} image`, url: deal.heroImageUrl, size: 0 }]
      : [];

  // Generate Deal ID in format like DRM-2025
  const dealIdShort = deal.projectName
    ? deal.projectName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) + '-' + new Date().getFullYear()
    : `TC-${deal.id.slice(0, 4).toUpperCase()}`;

  return {
    // Header
    projectName: deal.projectName,
    city: deal.city,
    state: deal.state,

    // Media
    logoUrl: deal.logoUrl,
    heroImageUrl: projectImages[0]?.url || deal.heroImageUrl,
    projectImages,

    // Stats
    parent: deal.sponsorName,
    location: `${deal.city}, ${deal.state}`,
    fullAddress: deal.address ? `${deal.address}, ${deal.city}, ${deal.state}` : `${deal.city}, ${deal.state}`,
    censusTract: censusTract,
    status: tractTypes.includes('SD') ? 'Severely Distressed' :
      tractTypes.includes('QCT') ? 'Qualified Census Tract' : 'Low-Income Community',
    povertyRate: deal.povertyRate || 28.5,
    medianIncome: deal.medianIncome ? `${deal.medianIncome}%` : '41.98%',
    unemployment: deal.unemployment || 8.2,
    projectCost: totalProjectCost,
    financingGap: financingGap,
    nmtcRequest: deal.allocation,
    lihtcAvail: 'N/A',
    shovelReady: deal.shovelReady ? 'Yes' : 'No',
    completion: deal.completionDate || 'Spring 2026',
    dealId: dealIdShort,

    // Contact
    contactName: deal.contactName || 'Michael Qualizza',
    contactEmail: deal.contactEmail || 'Q@tcredex.com',

    // Content
    projectDescription: deal.description || `${deal.projectName} represents a transformative investment in the ${deal.city} community. This ${deal.programType} project will create quality jobs and provide essential services to residents of this ${tractTypes.includes('SD') ? 'severely distressed' : 'qualified'} census tract. The development addresses critical community needs while generating measurable economic impact.`,

    communityImpact: deal.communityImpact || `Located in a ${tractTypes.includes('SD') ? 'Severely Distressed Census Tract' : 'Qualified Census Tract'}, this project will bring over ${Math.floor(deal.allocation / 125000)} construction jobs and ${Math.floor(deal.allocation / 250000)} permanent roles. Annual impact includes: ${Math.floor(deal.allocation / 3500)}+ counseling hours, ${Math.floor(deal.allocation / 10000)}+ individuals served, ${Math.floor(deal.allocation / 30000)}+ permanent housing placements, and ${Math.floor(deal.allocation / 110000)} intensive recovery completions. The project continues to serve the greater ${deal.city} area through comprehensive community development programs.`,

    // Financing
    sources,
    uses,
    totalSources: sources.reduce((sum, s) => sum + s.amount, 0),
    totalUses: uses.reduce((sum, u) => sum + u.amount, 0),
  };
}

export default function ProjectProfilePage() {
  const params = useParams();
  const dealId = (params?.id ?? '') as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDeal() {
      setLoading(true);
      try {
        const fetchedDeal = await fetchDealById(dealId);
        setDeal(fetchedDeal || null);
      } catch (error) {
        console.error('Failed to load deal:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDeal();
  }, [dealId]);

  const profile = deal ? generateProfileData(deal) : null;
  const projectImages = profile?.projectImages || [];
  const activeImage = projectImages[activeImageIndex]?.url || profile?.heroImageUrl;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [dealId, projectImages.length]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              {/* NMTC Eligible Badge */}
              <div className="border border-gray-300 rounded p-2">
                <div className="text-[10px] text-gray-600 leading-tight">
                  <div>This project is located</div>
                  <div>in qualifying census tract</div>
                  <div className="font-semibold">or its contiguous tract</div>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 border-t pt-1">ffiec.gov</div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              © {new Date().getFullYear()} tCredex.com
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex">
            {/* Left Sidebar - Project Stats */}
            <div className="w-72 bg-slate-800 text-white p-5 print:bg-slate-800 flex-shrink-0 flex flex-col">
              {/* Small tCredex Logo at very top */}
              <div className="mb-3 pb-2 border-b border-slate-600 flex items-center gap-1.5">
                <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-[9px]">tC</span>
                </div>
                <span className="text-xs font-semibold text-slate-400">tCredex</span>
              </div>

              {/* Sponsor Logo - Prominent */}
              <div className="mb-4 flex justify-center">
                {profile.logoUrl ? (
                  <div className="relative w-24 h-24 bg-white rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={profile.logoUrl}
                      alt={profile.parent || 'Sponsor logo'}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-400">
                      {profile.parent?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'SP'}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-sm font-bold text-white mb-4 tracking-wide">
                PROJECT STATS
              </h2>

              <div className="space-y-2 text-[13px] flex-1">
                <div>
                  <span className="font-semibold text-cyan-400">Parent:</span>
                  <span className="ml-1 text-white">{profile.parent}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Project:</span>
                  <span className="ml-1 text-white">{profile.projectName}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Location:</span>
                  <span className="ml-1 text-white">{profile.fullAddress}</span>
                </div>
                <div>
                  <span className="font-semibold text-cyan-400">Census Tract:</span>
                  <span className="ml-1 text-white">{profile.censusTract}</span>
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
                <div className="pt-3 border-t border-slate-600 mt-3">
                  <div className="font-semibold text-cyan-400 mb-1">Contact:</div>
                  <div className="text-white">{profile.contactName}</div>
                  <a href={`mailto:${profile.contactEmail}`} className="text-cyan-300 hover:text-cyan-200 text-[12px]">
                    {profile.contactEmail}
                  </a>
                </div>
              </div>

              {/* Tree Logo at bottom of sidebar */}
              <div className="pt-4 mt-auto flex justify-center border-t border-slate-600">
                <div className="mt-3 flex flex-col items-center">
                  {/* Tree Logo SVG */}
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Tree trunk */}
                    <rect x="45" y="65" width="10" height="25" fill="#8B5A2B"/>
                    {/* Tree foliage layers */}
                    <ellipse cx="50" cy="50" rx="28" ry="22" fill="#228B22"/>
                    <ellipse cx="50" cy="38" rx="22" ry="17" fill="#2E8B2E"/>
                    <ellipse cx="50" cy="26" rx="16" ry="13" fill="#32CD32"/>
                    {/* Small highlight circles for texture */}
                    <circle cx="38" cy="45" r="4" fill="#3CB371" opacity="0.7"/>
                    <circle cx="58" cy="38" r="3" fill="#3CB371" opacity="0.7"/>
                    <circle cx="48" cy="28" r="2.5" fill="#90EE90" opacity="0.6"/>
                  </svg>
                  <span className="text-[10px] text-slate-400 mt-1">Tree Logo</span>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-6">
              {/* Project Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-0">{profile.projectName}</h1>
              <p className="text-base text-teal-600 mb-4">{profile.city}, {profile.state}</p>

              {/* Project Hero Image */}
              <div className="w-full h-56 bg-gradient-to-br from-teal-50 to-green-50 rounded mb-6 flex items-center justify-center border border-gray-200 overflow-hidden relative">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={profile.projectName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Project Rendering</p>
                  </div>
                )}
              </div>

              {projectImages.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-6">
                  {projectImages.map((image, idx) => (
                    <button
                      key={image.id || `${image.name}-${idx}`}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-video rounded overflow-hidden border ${idx === activeImageIndex ? 'border-teal-500 ring-2 ring-teal-300' : 'border-gray-200'} hover:border-teal-400 transition-colors`}
                    >
                      <Image
                        src={image.url}
                        alt={image.name}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* The Project Section */}
              <section className="mb-5">
                <h2 className="text-base font-semibold text-teal-600 mb-2">The Project</h2>
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  {profile.projectDescription}
                </p>
              </section>

              {/* Community Impact Section */}
              <section className="mb-5">
                <h2 className="text-base font-semibold text-teal-600 mb-2">Community Impact</h2>
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  {profile.communityImpact}
                </p>
              </section>

              {/* Project Financing Section - Compact side by side */}
              <section className="mb-5">
                <h2 className="text-base font-semibold text-teal-600 mb-3">Project Financing</h2>
                <div className="flex gap-12">
                  {/* Sources */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 text-sm">Sources</h3>
                    <ul className="space-y-0.5 text-[13px] text-gray-700">
                      {profile.sources.map((source, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-gray-400">•</span>
                          <span>{formatCurrency(source.amount)} {source.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-1.5 border-t border-gray-200 font-semibold text-gray-900 text-[13px]">
                      Total Sources: {formatCurrency(profile.totalSources)}
                    </div>
                  </div>

                  {/* Uses */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1 text-sm">Uses</h3>
                    <ul className="space-y-0.5 text-[13px] text-gray-700">
                      {profile.uses.map((use, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-gray-400">•</span>
                          <span>{formatCurrency(use.amount)} {use.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-1.5 border-t border-gray-200 font-semibold text-gray-900 text-[13px]">
                      Total Uses: {formatCurrency(profile.totalUses)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Financing Structure Button */}
              <div className="mt-6">
                <button className="px-5 py-2.5 border-2 border-teal-600 text-teal-600 rounded hover:bg-teal-50 transition-colors font-medium text-sm">
                  View Financing Structure Diagram (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500">
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
