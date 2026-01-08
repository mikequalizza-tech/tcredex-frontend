'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PROGRAM_COLORS, Deal } from '@/lib/data/deals';
import { fetchMarketplaceDeals } from '@/lib/supabase/queries';

export default function FeaturedDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      try {
        const allDeals = await fetchMarketplaceDeals();
        console.log('All marketplace deals:', allDeals.map(d => ({ name: d.projectName, program: d.programType, visible: d.visible })));
        
        // Ensure we always include LIHTC deals if available
        const lihtcDeals = allDeals.filter(deal => deal.programType === 'LIHTC');
        const otherDeals = allDeals.filter(deal => deal.programType !== 'LIHTC');
        
        console.log('LIHTC deals found:', lihtcDeals.length);
        console.log('Other deals found:', otherDeals.length);
        
        // Shuffle other deals for variety
        const shuffledOthers = [...otherDeals].sort(() => Math.random() - 0.5);
        
        // Combine: prioritize LIHTC deals, then fill with others
        const featured = [
          ...lihtcDeals.slice(0, 2), // Show up to 2 LIHTC deals
          ...shuffledOthers.slice(0, 4 - Math.min(lihtcDeals.length, 2)) // Fill remaining slots
        ].slice(0, 4);
        
        console.log('Featured deals:', featured.map(d => ({ name: d.projectName, program: d.programType })));
        setDeals(featured);
      } catch (error) {
        console.error('Failed to load featured deals:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
    
    // Rotate deals every 30 seconds for variety
    const interval = setInterval(loadDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="relative py-16 md:py-24 bg-gray-950">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </section>
    );
  }

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
                href={`/signin?redirect=/deals/${deal.id}`}
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
            href="/signin?redirect=/deals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign In to Browse Projects
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
