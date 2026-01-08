'use client';

import { use, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchDealById } from '@/lib/supabase/queries';
import { Deal } from '@/lib/data/deals';
import { scoreDealFromRecord } from '@/lib/scoring/engine';
import ScoreCard from '@/components/scoring/ScoreCard';
import DealActionModals from '@/components/deals/DealActionModals';

// Types for outreach recipients
interface OutreachRecipient {
  id: string;
  organizationId: string;
  name: string;
  website?: string;
  isSystemUser: boolean;
  isContacted: boolean;
  matchScore: number;
  // CDE-specific
  missionStatement?: string;
  geographicFocus?: string[];
  sectorFocus?: string[];
  allocationAvailable?: number;
  // Investor-specific
  programs?: string[];
  sectors?: string[];
  minInvestment?: number;
  maxInvestment?: number;
}

interface OutreachData {
  cdes?: OutreachRecipient[];
  investors?: OutreachRecipient[];
  limits: { cde: number; investor: number };
}

// Program colors for display
const PROGRAM_COLORS: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
  NMTC: { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  HTC: { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-500/30' },
  LIHTC: { gradient: 'from-purple-500 to-pink-600', bg: 'bg-purple-900/30', text: 'text-purple-300', border: 'border-purple-500/30' },
  OZ: { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-500/30' },
};

// Status display config
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-700 text-gray-400' },
  submitted: { label: 'Submitted', color: 'bg-blue-900/50 text-blue-400' },
  under_review: { label: 'Under Review', color: 'bg-amber-900/50 text-amber-400' },
  available: { label: 'Available', color: 'bg-green-900/50 text-green-400' },
  seeking_capital: { label: 'Seeking Capital', color: 'bg-indigo-900/50 text-indigo-400' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-400' },
  closing: { label: 'Closing', color: 'bg-teal-900/50 text-teal-400' },
  closed: { label: 'Closed', color: 'bg-emerald-900/50 text-emerald-400' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-800 text-gray-400' },
};
import { useCurrentUser } from '@/lib/auth';

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  const [dealLoading, setDealLoading] = useState(true);
  const { isAuthenticated, isLoading, orgType, userName, orgName, organizationId } = useCurrentUser();

  // Calculate tCredex Score
  const dealScore = useMemo(() => {
    if (!deal) return null;
    try {
      return scoreDealFromRecord({
        census_tract: deal.censusTract,
        tract_poverty_rate: deal.povertyRate,
        tract_median_income: deal.medianIncome,
        tract_unemployment: deal.unemployment,
        total_project_cost: deal.projectCost,
        nmtc_financing_requested: deal.allocation,
        jobs_created: deal.jobsCreated,
        site_control: 'under_contract', // Default assumption for marketplace deals
        pro_forma_complete: true,
        third_party_reports: true,
        committed_capital_pct: 70,
        projected_completion_date: new Date().toISOString(),
        project_type: deal.programType,
        target_sectors: [deal.programType],
      });
    } catch (error) {
      console.error('Error calculating deal score:', error);
      return null;
    }
  }, [deal]);

  // Ownership detection - is current user the sponsor of this deal?
  const isOwner = orgType === 'sponsor' &&
                  deal?.sponsorOrganizationId &&
                  deal.sponsorOrganizationId === organizationId;

  useEffect(() => {
    async function loadDeal() {
      setDealLoading(true);
      try {
        const fetchedDeal = await fetchDealById(id);
        setDeal(fetchedDeal || undefined);
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

  // New modal state for role-based actions
  const [activeModal, setActiveModal] = useState<'interest' | 'loi' | 'commitment' | 'request-info' | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Sponsor outreach state (for when owner contacts CDEs/Investors)
  const [contactCDEs, setContactCDEs] = useState(true);
  const [contactInvestors, setContactInvestors] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachData | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState<string | null>(null);

  // Fetch outreach options when modal opens (for sponsors)
  const fetchOutreachOptions = useCallback(async () => {
    if (!isOwner || !organizationId) return;

    setOutreachLoading(true);
    setOutreachError(null);

    try {
      const type = contactCDEs && contactInvestors ? 'both' : contactCDEs ? 'cde' : 'investor';
      const response = await fetch(
        `/api/deals/${id}/outreach?type=${type}&senderOrgId=${organizationId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch outreach options');
      }

      const data: OutreachData = await response.json();
      setOutreachData(data);
    } catch (error) {
      console.error('Error fetching outreach options:', error);
      setOutreachError('Failed to load available partners');
    } finally {
      setOutreachLoading(false);
    }
  }, [id, isOwner, organizationId, contactCDEs, contactInvestors]);

  // Handle role-based actions (LOI, Commitment, Request Info)
  const handleActionSubmit = async (data: any) => {
    try {
      const endpoint = `/api/deals/${id}/${data.type}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: id,
          message: data.message,
          senderOrgId: data.senderOrgId,
          senderName: data.senderName,
          senderOrg: data.senderOrg,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit action');
      }

      // Show success and close modal
      setShowActionModal(false);
      setActiveModal(null);
    } catch (error) {
      console.error('Error submitting action:', error);
      throw error;
    }
  };

  // Open action modal
  const openActionModal = (type: 'interest' | 'loi' | 'commitment' | 'request-info') => {
    setActiveModal(type);
    setShowActionModal(true);
  };

  // Toggle recipient selection
  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  // Get combined recipient list based on checkboxes
  const getAvailableRecipients = () => {
    if (!outreachData) return [];
    const recipients: OutreachRecipient[] = [];
    if (contactCDEs && outreachData.cdes) {
      recipients.push(...outreachData.cdes.map(c => ({ ...c, type: 'cde' as const })));
    }
    if (contactInvestors && outreachData.investors) {
      recipients.push(...outreachData.investors.map(i => ({ ...i, type: 'investor' as const })));
    }
    return recipients.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleExpressInterest = async () => {
    setInterestSubmitting(true);

    if (isOwner) {
      // Sponsor contacting CDEs/Investors
      if (selectedRecipients.length === 0) {
        setOutreachError('Please select at least one recipient');
        setInterestSubmitting(false);
        return;
      }

      try {
        // Group selected recipients by type
        const selectedCDEIds = outreachData?.cdes
          ?.filter(c => selectedRecipients.includes(c.id))
          .map(c => c.id) || [];
        const selectedInvestorIds = outreachData?.investors
          ?.filter(i => selectedRecipients.includes(i.id))
          .map(i => i.id) || [];

        const requests = [];

        // Send CDE requests if any selected
        if (selectedCDEIds.length > 0) {
          requests.push(
            fetch(`/api/deals/${id}/outreach`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientIds: selectedCDEIds,
                recipientType: 'cde',
                message: interestMessage,
                senderId: organizationId, // TODO: Get actual user ID from auth
                senderOrgId: organizationId,
                senderName: userName,
                senderOrg: orgName,
              }),
            })
          );
        }

        // Send Investor requests if any selected
        if (selectedInvestorIds.length > 0) {
          requests.push(
            fetch(`/api/deals/${id}/outreach`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientIds: selectedInvestorIds,
                recipientType: 'investor',
                message: interestMessage,
                senderId: organizationId, // TODO: Get actual user ID from auth
                senderOrgId: organizationId,
                senderName: userName,
                senderOrg: orgName,
              }),
            })
          );
        }

        const results = await Promise.all(requests);
        const allSuccessful = results.every(r => r.ok);

        if (allSuccessful) {
          setInterestSubmitted(true);
          setShowInterestModal(false);
          setInterestMessage('');
          setSelectedRecipients([]);
          setOutreachData(null);
        } else {
          const errorResponse = results.find(r => !r.ok);
          const errorData = await errorResponse?.json();
          setOutreachError(errorData?.error || 'Failed to send some outreach requests');
        }
      } catch (error) {
        console.error('Error sending outreach:', error);
        setOutreachError('Failed to send outreach. Please try again.');
      }
    } else {
      // CDE/Investor contacting Sponsor (original flow)
      try {
        const response = await fetch(`/api/messages`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: id,
            senderId: organizationId, // TODO: Get actual user ID from auth
            senderName: userName,
            senderOrg: orgName,
            content: interestMessage || `I am interested in ${deal?.projectName}`,
          }),
        });

        if (response.ok) {
          setInterestSubmitted(true);
          setShowInterestModal(false);
          setInterestMessage('');
        } else {
          console.error('Failed to submit interest');
        }
      } catch (error) {
        console.error('Error submitting interest:', error);
      }
    }

    setInterestSubmitting(false);
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
            {/* tCredex Score Card */}
            {dealScore && (
              <ScoreCard score={dealScore} showDetails={true} />
            )}

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
                  <>
                    {/* SPONSOR ACTIONS */}
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setShowInterestModal(true)}
                          className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
                        >
                          Contact CDEs / Investors
                        </button>
                        <Link
                          href={`/intake?dealId=${id}`}
                          className="block w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-center font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Deal
                        </Link>
                      </>
                    )}
                    
                    {/* CDE/INVESTOR ACTIONS */}
                    {!isOwner && (
                      <>
                        <button
                          onClick={() => openActionModal('interest')}
                          disabled={interestSubmitted}
                          className={`block w-full py-3 text-center font-semibold rounded-lg transition-colors ${
                            interestSubmitted
                              ? 'bg-green-600 text-white cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {interestSubmitted ? '✓ Interest Submitted' : 'Express Interest'}
                        </button>
                        <button 
                          onClick={() => openActionModal('request-info')}
                          className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
                        >
                          Request More Info
                        </button>
                        {orgType === 'cde' && (
                          <button 
                            onClick={() => openActionModal('loi')}
                            className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg transition-colors"
                          >
                            Create LOI
                          </button>
                        )}
                        {orgType === 'investor' && (
                          <button 
                            onClick={() => openActionModal('commitment')}
                            className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg transition-colors"
                          >
                            Create Commitment
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* COMMON ACTIONS */}
                    <Link
                      href={`/deals/${id}/profile`}
                      className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center font-medium rounded-lg transition-colors"
                    >
                      View Full Profile
                    </Link>
                    <Link
                      href={`/deals/${id}/card`}
                      className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Intake Form
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/signin"
                    className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
                  >
                    Sign In to Connect
                  </Link>
                )}
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

      {/* New Role-Based Action Modals */}
      <DealActionModals
        deal={deal}
        orgType={orgType}
        orgName={orgName}
        userName={userName}
        organizationId={organizationId}
        isOwner={isOwner}
        showModal={showActionModal}
        modalType={activeModal}
        onClose={() => {
          setShowActionModal(false);
          setActiveModal(null);
        }}
        onSubmit={handleActionSubmit}
      />

      {/* Express Interest Modal - Role-Aware */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowInterestModal(false)} />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            {isOwner ? (
              /* SPONSOR VIEW - Contact CDEs/Investors */
              <>
                <h3 className="text-xl font-semibold text-white mb-2">Contact CDEs & Investors</h3>
                <p className="text-gray-400 text-sm mb-6">Reach out to potential partners for {deal.projectName}</p>

                <div className="space-y-4">
                  {/* Contact type checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Who would you like to contact?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactCDEs}
                          onChange={(e) => setContactCDEs(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-200">CDEs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactInvestors}
                          onChange={(e) => setContactInvestors(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-200">Investors</span>
                      </label>
                    </div>
                  </div>

                  {/* Recipient selection - populated from API */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Recipients <span className="text-gray-500">(matched partners shown first)</span>
                    </label>

                    {outreachError && (
                      <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-300">{outreachError}</p>
                      </div>
                    )}

                    {!contactCDEs && !contactInvestors ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
                        <p className="text-gray-400 text-sm">Select at least one contact type above</p>
                      </div>
                    ) : outreachLoading ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Loading available partners...</p>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 max-h-64 overflow-y-auto">
                        {getAvailableRecipients().length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-gray-400 text-sm">No available partners found</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-700">
                            {getAvailableRecipients().map((recipient) => {
                              const isSelected = selectedRecipients.includes(recipient.id);
                              const isCDE = 'missionStatement' in recipient;
                              const typeLabel = isCDE ? 'CDE' : 'Investor';
                              const limit = isCDE ? outreachData?.limits.cde : outreachData?.limits.investor;
                              const selectedOfType = selectedRecipients.filter(id =>
                                isCDE
                                  ? outreachData?.cdes?.some(c => c.id === id)
                                  : outreachData?.investors?.some(i => i.id === id)
                              ).length;
                              const atLimit = !isSelected && limit !== undefined && selectedOfType >= limit;

                              return (
                                <label
                                  key={recipient.id}
                                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                                    recipient.isContacted
                                      ? 'opacity-50 cursor-not-allowed bg-gray-800/30'
                                      : atLimit
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isSelected
                                          ? 'bg-indigo-900/30'
                                          : 'hover:bg-gray-800/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => !recipient.isContacted && !atLimit && toggleRecipient(recipient.id)}
                                    disabled={recipient.isContacted || atLimit}
                                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-200 truncate">{recipient.name}</span>
                                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                                        isCDE ? 'bg-emerald-900/50 text-emerald-300' : 'bg-purple-900/50 text-purple-300'
                                      }`}>
                                        {typeLabel}
                                      </span>
                                      {recipient.matchScore > 50 && (
                                        <span className="px-1.5 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded">
                                          Match
                                        </span>
                                      )}
                                      {!recipient.isSystemUser && (
                                        <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                                          Email only
                                        </span>
                                      )}
                                    </div>
                                    {recipient.isContacted && (
                                      <p className="text-xs text-amber-400 mt-0.5">Already contacted</p>
                                    )}
                                    {isCDE && recipient.allocationAvailable && recipient.allocationAvailable > 0 && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        ${(recipient.allocationAvailable / 1000000).toFixed(1)}M available
                                      </p>
                                    )}
                                    {!isCDE && recipient.programs && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {recipient.programs.join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {outreachData && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {contactCDEs && (
                          <span>CDEs: {outreachData.limits.cde} slots remaining</span>
                        )}
                        {contactInvestors && (
                          <span>Investors: {outreachData.limits.investor} slots remaining</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
                    <textarea
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Introduce your project and explain what you're looking for..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-300">
                      <strong>What gets sent:</strong> Your Project Profile PDF + this message. Recipients can respond directly or request more info.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowInterestModal(false);
                      setSelectedRecipients([]);
                      setOutreachError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={interestSubmitting || (!contactCDEs && !contactInvestors) || selectedRecipients.length === 0}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {interestSubmitting ? 'Sending...' : `Send Outreach${selectedRecipients.length > 0 ? ` (${selectedRecipients.length})` : ''}`}
                  </button>
                </div>
              </>
            ) : (
              /* CDE/INVESTOR VIEW - Express Interest to Sponsor */
              <>
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
              </>
            )}
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
