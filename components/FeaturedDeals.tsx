'use client';

import Link from 'next/link';
import { getFeaturedDeals, PROGRAM_COLORS, type Deal } from '@/lib/data/deals';

export default function FeaturedDeals() {
  const deals = getFeaturedDeals();

  return (
    <section className="relative py-16 md:py-24 bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Marketplace
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Explore tax credit deals from qualified sponsors. Each project has been vetted for program eligibility.
          </p>
        </div>

        {/* Deal Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal) => {
            const colors = PROGRAM_COLORS[deal.programType];
            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="group bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-indigo-900/10 hover:-translate-y-1"
              >
                {/* Card Header with Program Badge */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {deal.programType}
                    </span>
                    <span className="text-xs text-gray-500">{deal.city}, {deal.state.slice(0, 2).toUpperCase()}</span>
                  </div>
                  
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1">
                    {deal.projectName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{deal.sponsorName}</p>
                  
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                    {deal.description}
                  </p>
                </div>

                {/* Card Footer with Metrics */}
                <div className="px-5 py-4 bg-gray-800/50 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Allocation</p>
                      <p className="text-lg font-bold text-white">${(deal.allocation / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Credit Price</p>
                      <p className="text-lg font-bold text-emerald-400">${deal.creditPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="px-5 py-3 bg-indigo-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium text-white">View Project Details →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Browse All Projects
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            25+ active deals across NMTC, HTC, LIHTC, and Opportunity Zones
          </p>
        </div>
      </div>
    </section>
  );
}
