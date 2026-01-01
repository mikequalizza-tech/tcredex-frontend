'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchCDEBySlug, CDEDetail } from '@/lib/supabase/queries';
import { useCurrentUser } from '@/lib/auth';

// Mission focus labels
const MISSION_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  community_facility: 'Community Facilities',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  mixed_use: 'Mixed Use',
  affordable_housing: 'Affordable Housing',
  food_access: 'Food Access',
  childcare: 'Childcare',
  workforce: 'Workforce Development',
};

interface CDEPageProps {
  params: Promise<{ slug: string }>;
}

export default function CDEDetailPage({ params }: CDEPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [cde, setCDE] = useState<CDEDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading, orgType } = useCurrentUser();

  useEffect(() => {
    async function loadCDE() {
      setLoading(true);
      try {
        const fetchedCDE = await fetchCDEBySlug(slug);
        setCDE(fetchedCDE);
      } catch (error) {
        console.error('Failed to load CDE:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCDE();
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signin?redirect=/cde/${slug}`);
    }
  }, [isLoading, isAuthenticated, router, slug]);

  if (isLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading CDE profile...</p>
        </div>
      </div>
    );
  }

  if (!cde) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">CDE Not Found</h1>
          <p className="text-gray-400 mb-6">This CDE profile is not available.</p>
          <Link href="/deals" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-800 pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/deals" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">CDE</span>
                {cde.acceptingApplications ? (
                  <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-sm">Accepting Projects</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-500/30 text-gray-300 rounded-full text-sm">Applications Closed</span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{cde.name}</h1>
              <p className="text-xl text-white/80">{cde.headquartersCity}, {cde.headquartersState}</p>
            </div>

            {orgType === 'sponsor' && cde.acceptingApplications && (
              <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100">
                Request Allocation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed">{cde.description || 'No description available.'}</p>
            </section>

            {cde.missionFocus.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Mission Focus</h2>
                <div className="flex flex-wrap gap-2">
                  {cde.missionFocus.map(m => (
                    <span key={m} className="px-3 py-1.5 bg-indigo-900/30 text-indigo-300 rounded-lg text-sm">
                      {MISSION_LABELS[m] || m}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {cde.projectTypes.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Project Types</h2>
                <div className="flex flex-wrap gap-2">
                  {cde.projectTypes.map(t => (
                    <span key={t} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm">{t}</span>
                  ))}
                </div>
              </section>
            )}

            {cde.serviceArea.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Service Area</h2>
                <p className="text-gray-400 text-sm mb-3">{cde.serviceAreaType}</p>
                <div className="flex flex-wrap gap-2">
                  {cde.serviceArea.map(s => (
                    <span key={s} className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm">{s}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Track Record</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">{cde.projectsClosed}</p>
                  <p className="text-sm text-gray-400">Projects Closed</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">${(cde.totalDeployed / 1000000).toFixed(0)}M</p>
                  <p className="text-sm text-gray-400">Total Deployed</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">${(cde.avgDealSize / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-gray-400">Avg Deal Size</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Allocation Summary</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Available</span>
                  <span className="text-2xl font-bold text-green-400">${(cde.availableAllocation / 1000000).toFixed(0)}M</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Total Allocation</span>
                  <span className="text-xl font-bold text-white">${(cde.totalAllocation / 1000000).toFixed(0)}M</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Allocation Year</span>
                  <span className="text-white">{cde.allocationYear}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Deal Range</span>
                  <span className="text-white">${(cde.minDealSize / 1000000).toFixed(0)}M - ${(cde.maxDealSize / 1000000).toFixed(0)}M</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white">{cde.responseTime}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {orgType === 'sponsor' && cde.acceptingApplications && (
                  <button className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg">
                    Request Allocation
                  </button>
                )}
                {cde.website && (
                  <a
                    href={cde.website.startsWith('http') ? cde.website : `https://${cde.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center rounded-lg"
                  >
                    Visit Website
                  </a>
                )}
              </div>

              {(cde.primaryContact || cde.contactEmail) && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Contact</h4>
                  {cde.primaryContact && <p className="text-white font-medium">{cde.primaryContact}</p>}
                  {cde.contactEmail && <p className="text-gray-400 text-sm">{cde.contactEmail}</p>}
                  {cde.contactPhone && <p className="text-gray-400 text-sm">{cde.contactPhone}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
