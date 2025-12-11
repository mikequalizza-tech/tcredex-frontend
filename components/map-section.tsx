'use client';

import DealMap from '@/components/maps/DealMap';

export default function MapSection() {
  // Example: St. Louis - major NMTC market
  const centerLocation = { latitude: 38.627, longitude: -90.1994, name: 'St. Louis' };
  
  // Example deal locations
  const dealMarkers = [
    { latitude: 38.637, longitude: -90.1894, name: 'NMTC Project A' },
    { latitude: 38.617, longitude: -90.2094, name: 'LIHTC Development' },
    { latitude: 38.647, longitude: -90.1794, name: 'HTC Rehabilitation' },
  ];

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Map Intelligence
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Census Tract Visualization
            </h2>
            <p className="text-lg text-indigo-200/65">
              Explore eligible census tracts, distress indicators, and deal locations 
              with our interactive map. Instantly see NMTC, LIHTC, and HTC eligibility overlays.
            </p>
          </div>

          {/* Map */}
          <div data-aos="fade-up">
            <DealMap
              center={centerLocation}
              markers={dealMarkers}
              height="500px"
              zoom={11}
              className="border border-gray-700/50"
            />
          </div>

          {/* Map legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span>Active Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>NMTC Eligible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span>Distressed Tracts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
