'use client';

import DealCard, { Deal } from '@/components/DealCard';

// Sample deals - replace with API data
const sampleDeals: Deal[] = [
  {
    id: 'D12345',
    projectName: 'Eastside Grocery Co-Op',
    location: 'Springfield, IL',
    parent: 'Local Roots Foundation',
    address: '1234 Market St',
    censusTract: '17031010100',
    povertyRate: 32,
    medianIncome: 28500,
    unemployment: 11.4,
    projectCost: 7200000,
    fedNmtcReq: 5000000,
    stateNmtcReq: 1500000,
    htc: 450000,
    shovelReady: true,
    completionDate: 'Dec 2025',
    financingGap: 400000,
  },
  {
    id: 'D12346',
    projectName: 'Northgate Health Center',
    location: 'Detroit, MI',
    parent: 'Community Health Partners',
    address: '500 Woodward Ave',
    censusTract: '26163520100',
    povertyRate: 38,
    medianIncome: 24200,
    unemployment: 14.2,
    projectCost: 12500000,
    fedNmtcReq: 8000000,
    stateNmtcReq: 2000000,
    shovelReady: true,
    completionDate: 'Mar 2026',
    financingGap: 750000,
  },
  {
    id: 'D12347',
    projectName: 'Heritage Arts Center',
    location: 'Baltimore, MD',
    parent: 'Baltimore Cultural Trust',
    address: '221 Pratt St',
    censusTract: '24510030100',
    povertyRate: 28,
    medianIncome: 31500,
    unemployment: 9.8,
    projectCost: 4800000,
    fedNmtcReq: 3000000,
    htc: 1200000,
    shovelReady: false,
    completionDate: 'Jun 2026',
    financingGap: 280000,
  },
];

export default function FeaturedDeals() {
  const handleRequestMemo = (dealId: string) => {
    console.log('Requesting memo for deal:', dealId);
    // TODO: Open modal or navigate to memo request
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Live Marketplace
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Featured Deal Opportunities
            </h2>
            <p className="text-lg text-indigo-200/65">
              Pre-qualified NMTC, LIHTC, and HTC projects ready for CDE allocation 
              and investor commitment. All deals scored by our Automatch AI™.
            </p>
          </div>

          {/* Deal Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-aos="fade-up">
            {sampleDeals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                onRequestMemo={handleRequestMemo}
              />
            ))}
          </div>

          {/* View All CTA */}
          <div className="mt-10 text-center">
            <a
              href="/matching"
              className="btn group relative text-gray-100 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              View All Deals
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
