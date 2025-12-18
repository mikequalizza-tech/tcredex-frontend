'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDealById, PROGRAM_COLORS, TRACT_LABELS } from '@/lib/data/deals';

export default function DealCardPage() {
  const params = useParams();
  const dealId = params.id as string;
  const deal = getDealById(dealId);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Deal Not Found</h1>
          <Link href="/deals" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const colors = PROGRAM_COLORS[deal.programType];
  
  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const handlePrint = () => {
    window.print();
  };

  // Calculate mock data
  const totalProjectCost = deal.allocation * 2.5;
  const jobsCreated = deal.jobsCreated || Math.floor(deal.allocation / 250000);
  const squareFootage = Math.floor(deal.allocation / 150);
  
  // Generate mock census tract from state and deal ID
  const stateCode = deal.state === 'IL' ? '17' : deal.state === 'WI' ? '55' : deal.state === 'MI' ? '26' : deal.state === 'MO' ? '29' : deal.state === 'IN' ? '18' : '99';
  const censusTract = `${stateCode}031${dealId.replace(/\D/g, '').padStart(6, '0').slice(0, 6)}`;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Actions - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/deals/${dealId}`} className="text-gray-400 hover:text-white flex items-center gap-2">
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
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Deal Card - Printable Area */}
      <div className="max-w-3xl mx-auto p-6 print:p-0 print:max-w-none">
        <div 
          ref={cardRef}
          className="bg-white text-gray-900 rounded-lg shadow-xl print:shadow-none print:rounded-none overflow-hidden"
          style={{ aspectRatio: '8.5/11' }}
        >
          {/* Header Banner */}
          <div className={`bg-gradient-to-r ${colors.gradient} px-8 py-6 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-bold">
                    {deal.programType}
                  </span>
                  {deal.tractType.map(tract => (
                    <span key={tract} className="px-2 py-1 bg-white/10 rounded text-xs">
                      {TRACT_LABELS[tract as keyof typeof TRACT_LABELS] || tract}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold mb-1">{deal.projectName}</h1>
                <p className="text-white/80">{deal.city}, {deal.state}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-100">tCredex</div>
                <div className="text-sm text-white/60">tcredex.com</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{formatCurrency(deal.allocation)}</div>
                <div className="text-xs text-gray-500 uppercase">Allocation Request</div>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalProjectCost)}</div>
                <div className="text-xs text-gray-500 uppercase">Total Project Cost</div>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">${deal.creditPrice.toFixed(2)}</div>
                <div className="text-xs text-gray-500 uppercase">Credit Price</div>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{jobsCreated}</div>
                <div className="text-xs text-gray-500 uppercase">Jobs Created</div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2">Project Info & Community Impact</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {deal.description || `The ${deal.projectName} project will create ${jobsCreated} jobs and serve the ${deal.city} community with essential services. Located in a ${deal.tractType.includes('SD') ? 'severely distressed' : 'qualified'} census tract, this development addresses critical community needs while generating measurable economic impact.`}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Square Footage</span>
                    <span className="font-medium">{squareFootage.toLocaleString()} SF</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Jobs Created</span>
                    <span className="font-medium">{jobsCreated} FTE</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Census Tract</span>
                    <span className="font-medium font-mono">{censusTract}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Tract Designation</span>
                    <span className="font-medium">{deal.tractType.join(', ')}</span>
                  </div>
                  {deal.povertyRate && (
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">Poverty Rate</span>
                      <span className="font-medium text-red-600">{deal.povertyRate}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2">Sponsor Information</h2>
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500">
                      {deal.sponsorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{deal.sponsorName}</div>
                      <div className="text-xs text-gray-500">Project Sponsor</div>
                    </div>
                  </div>
                </div>

                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b pb-2 mt-6">Deal Structure</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Program</span>
                    <span className="font-medium">{deal.programType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium capitalize">{deal.programLevel}</span>
                  </div>
                  {deal.stateProgram && (
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-gray-500">State Program</span>
                      <span className="font-medium">{deal.stateProgram}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Submitted</span>
                    <span className="font-medium">{new Date(deal.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Readiness Indicators */}
                <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs font-bold text-emerald-700 uppercase mb-2">Project Readiness</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Shovel Ready</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ QALICB Formed</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">✓ Phase I Complete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Benefits */}
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="text-xs font-bold text-indigo-700 uppercase mb-2">Community Benefits</div>
              <div className="grid grid-cols-3 gap-4 text-sm text-indigo-900">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Quality job creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Distressed area investment</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Essential services</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-8 py-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                <span className="font-semibold text-indigo-600">tCredex.com</span>
                <span className="mx-2">•</span>
                <span>Tel: 847-943-9389</span>
                <span className="mx-2">•</span>
                <span>Email: info@tCredex.com</span>
              </div>
              <div>
                <span>File #{dealId.toUpperCase()}</span>
                <span className="mx-2">•</span>
                <span>Generated {new Date().toLocaleDateString()}</span>
              </div>
            </div>
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
        }
      `}</style>
    </div>
  );
}
