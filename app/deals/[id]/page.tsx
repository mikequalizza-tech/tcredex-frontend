'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDealById, PROGRAM_COLORS, STATUS_CONFIG, Deal } from '@/lib/data/deals';
import { useCurrentUser } from '@/lib/auth';

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  const [dealLoading, setDealLoading] = useState(true);
  const { isAuthenticated, isLoading, orgType, userName, orgName } = useCurrentUser();

  useEffect(() => {
    async function loadDeal() {
      setDealLoading(true);
      try {
        const fetchedDeal = await getDealById(id);
        setDeal(fetchedDeal);
      } catch (error) {
        console.error('Failed to load deal:', error);
      } finally {
        setDealLoading(false);
      }
    }
    loadDeal();
  }, [id]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  const handleExpressInterest = async () => {
    setInterestSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInterestSubmitting(false);
    setInterestSubmitted(true);
    setShowInterestModal(false);
    setInterestMessage('');
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signin?redirect=/deals/${id}`);
    }
  }, [isLoading, isAuthenticated, router, id]);

  // Show loading state
  if (isLoading || dealLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <p className="text-gray-400 mb-6">This project may no longer be available.</p>
          <Link href="/deals" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const colors = PROGRAM_COLORS[deal.programType];
  const totalBudget = deal.useOfFunds && deal.useOfFunds.length > 0
    ? deal.useOfFunds.reduce((sum, item) => sum + item.amount, 0)
    : deal.allocation;

  return (
    <>
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} pt-8 pb-16`}>
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
              {isAuthenticated ? (
                <button 
                  onClick={() => setShowInterestModal(true)}
                  disabled={interestSubmitted}
                  className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                    interestSubmitted 
                      ? 'bg-green-600 text-white cursor-default' 
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {interestSubmitted ? '✓ Interest Submitted' : 'Express Interest'}
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign In to Connect
                </Link>
              )}
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

            {/* Community Impact */}
            {deal.communityImpact && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Community Impact</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {deal.communityImpact}
                </p>
              </section>
            )}

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
                {isAuthenticated ? (
                  <button 
                    onClick={() => setShowInterestModal(true)}
                    disabled={interestSubmitted}
                    className={`block w-full py-3 text-center font-semibold rounded-lg transition-colors ${
                      interestSubmitted
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {interestSubmitted ? '✓ Interest Submitted' : 'Express Interest'}
                  </button>
                ) : (
                  <Link
                    href="/signin"
                    className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
                  >
                    Sign In to Connect
                  </Link>
                )}
                <Link
                  href={`/deals/${id}/profile`}
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                >
                  View Project Profile
                </Link>
                <Link
                  href={`/deals/${id}/card`}
                  className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Deal Card
                </Link>
                <Link
                  href="/pricing"
                  className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center font-medium rounded-lg transition-colors"
                >
                  Run Pricing Estimate
                </Link>
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Sign in or register to view full details and contact the sponsor.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowInterestModal(false)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-2">Express Interest</h3>
            <p className="text-gray-400 text-sm mb-6">Submit your interest in {deal.projectName}</p>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Your Organization</span>
                  <span className="text-white font-medium">{orgName || 'Demo Organization'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Contact</span>
                  <span className="text-white">{userName || 'User'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message to Sponsor (Optional)</label>
                <textarea
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Introduce yourself and explain your interest in this project..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
                <p className="text-xs text-indigo-300">
                  <strong>What happens next:</strong> The sponsor will receive your contact information and message. They typically respond within 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInterestModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExpressInterest}
                disabled={interestSubmitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait transition-colors font-medium"
              >
                {interestSubmitting ? 'Submitting...' : 'Submit Interest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {interestSubmitted && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-900 border border-green-700 rounded-xl p-4 shadow-xl animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-100">Interest Submitted!</p>
              <p className="text-sm text-green-300">The sponsor will contact you soon.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
