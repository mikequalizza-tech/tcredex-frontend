'use client';

import { use } from 'react';
import Link from 'next/link';
import { getDealById, PROGRAM_COLORS, STATUS_CONFIG } from '@/lib/data/deals';

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealPageProps) {
  const { id } = use(params);
  const deal = getDealById(id);

  if (!deal) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <p className="text-gray-400 mb-6">This project may no longer be available.</p>
          <Link href="/deals" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
            Browse Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const colors = PROGRAM_COLORS[deal.programType];
  const totalBudget = deal.useOfFunds?.reduce((sum, item) => sum + item.amount, 0) || deal.allocation;

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} py-16`}>
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/deals" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>
          
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
                  {deal.programType}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[deal.status].color}`}>
                  {STATUS_CONFIG[deal.status].label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{deal.projectName}</h1>
              <p className="text-xl text-white/80">{deal.city}, {deal.state}</p>
            </div>
            
            <div className="flex gap-3">
              <Link
                href="/signin"
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Express Interest
              </Link>
              <button className="px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Project Overview</h2>
              <p className="text-gray-300 leading-relaxed">
                {deal.description || `${deal.projectName} is a ${deal.programType} project located in ${deal.city}, ${deal.state}. This ${deal.programLevel} program opportunity has an allocation of $${(deal.allocation / 1000000).toFixed(1)}M at a credit price of $${deal.creditPrice.toFixed(2)}.`}
              </p>
            </section>

            {/* Highlights */}
            {deal.projectHighlights && deal.projectHighlights.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Project Highlights</h2>
                <ul className="space-y-3">
                  {deal.projectHighlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Use of Funds */}
            {deal.useOfFunds && deal.useOfFunds.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Use of Funds</h2>
                <div className="space-y-4">
                  {deal.useOfFunds.map((item, idx) => {
                    const percentage = (item.amount / totalBudget) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{item.category}</span>
                          <span className="text-gray-400">${(item.amount / 1000000).toFixed(2)}M ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${colors.gradient}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-gray-800 flex justify-between">
                    <span className="font-semibold text-white">Total Project Cost</span>
                    <span className="font-semibold text-white">${(totalBudget / 1000000).toFixed(2)}M</span>
                  </div>
                </div>
              </section>
            )}

            {/* Timeline */}
            {deal.timeline && deal.timeline.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Project Timeline</h2>
                <div className="space-y-4">
                  {deal.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {item.completed ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${item.completed ? 'text-white' : 'text-gray-400'}`}>{item.milestone}</p>
                      </div>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsor */}
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About the Sponsor</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
                  {deal.sponsorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{deal.sponsorName}</h3>
                  <p className="text-gray-400 text-sm">
                    {deal.sponsorDescription || `${deal.sponsorName} is a qualified project sponsor with experience in ${deal.programType} transactions.`}
                  </p>
                  {deal.website && (
                    <p className="text-indigo-400 text-sm mt-2">{deal.website}</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Metrics Card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Investment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Allocation</span>
                  <span className="text-2xl font-bold text-white">${(deal.allocation / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Credit Price</span>
                  <span className="text-2xl font-bold text-emerald-400">${deal.creditPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Program</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                    {deal.programType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Tract Type</span>
                  <div className="flex gap-1">
                    {deal.tractType.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">{t}</span>
                    ))}
                  </div>
                </div>
                {deal.povertyRate && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Poverty Rate</span>
                    <span className="text-white font-medium">{deal.povertyRate}%</span>
                  </div>
                )}
                {deal.jobsCreated && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Jobs Created</span>
                    <span className="text-white font-medium">{deal.jobsCreated}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/signin"
                  className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
                >
                  Express Interest
                </Link>
                <Link
                  href="/pricing"
                  className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center font-medium rounded-lg transition-colors"
                >
                  Run Pricing Estimate
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Sign in or register to view full details and contact the sponsor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
