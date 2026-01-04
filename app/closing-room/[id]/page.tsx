'use client';

import { useState, useEffect, use } from 'react';
import {
  ClosingChecklist,
  DealRoomParticipants,
  DocumentVault,
  ClosingTimeline,
  type Participant,
  type ClosingDocument,
  type TimelineEvent
} from '@/components/closing';
import DealLifecycleTimeline from '@/components/compliance/DealLifecycleTimeline';
import { calculateClosingFee, formatFee, getEffectiveRate } from '@/lib/closing/fee-engine';
import {
  calculateCreditPricing,
  formatCashOnCash,
  formatCreditPrice,
  getProgramDisplayName,
  TOTAL_CREDITS,
  type CreditProgram
} from '@/lib/pricing/credit-streams';

type TabType = 'overview' | 'documents' | 'participants' | 'timeline' | 'compliance' | 'economics';

interface ClosingRoomPageProps {
  params: Promise<{ id: string }>;
}

interface ClosingRoomData {
  id: string;
  deal_id: string;
  status: string;
  allocation_amount: number;
  investment_amount: number;
  credit_type: CreditProgram;
  checklist_pct: number;
  target_close_date: string | null;
  opened_at: string | null;
  has_open_issues: boolean;
  issue_count: number;
  deals: {
    id: string;
    project_name: string;
    program_type: string;
    total_project_cost: number;
    allocation_request: number;
    organizations: { name: string } | null;
  };
  closing_room_participants: Participant[];
  closing_room_milestones: TimelineEvent[];
  closing_room_issues: { id: string; title: string; priority: string; status: string }[];
}

interface ChecklistData {
  deal: { id: string; project_name: string; program_type: string };
  checklist: Record<string, { id: string; item_name: string; status: string; category: string }[]>;
  progress: { total: number; completed: number; percentage: number };
}

export default function ClosingRoomPage({ params }: ClosingRoomPageProps) {
  const { id: dealId } = use(params);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [closingRoom, setClosingRoom] = useState<ClosingRoomData | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch closing room data
        const roomResponse = await fetch(`/api/closing-room?dealId=${dealId}`);
        if (roomResponse.ok) {
          const data = await roomResponse.json();
          setClosingRoom(data.closingRoom);
        }

        // Fetch checklist data
        const checklistResponse = await fetch(`/api/closing-room/checklist?dealId=${dealId}`);
        if (checklistResponse.ok) {
          const data = await checklistResponse.json();
          setChecklist(data);
        }
      } catch (err) {
        console.error('Failed to fetch closing room data:', err);
        setError('Failed to load closing room');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dealId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  if (error || !closingRoom) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-200 mb-2">Closing Room Not Found</h2>
          <p className="text-gray-400">This deal may not have a closing room yet.</p>
          <a href="/closing-room" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
            ← Back to Closing Rooms
          </a>
        </div>
      </main>
    );
  }

  // Extract deal info
  const deal = closingRoom.deals;
  const projectName = deal?.project_name || 'Unknown Project';
  const sponsorName = deal?.organizations?.name || 'Unknown Sponsor';
  const programType = closingRoom.credit_type || deal?.program_type || 'NMTC';
  const grossBasis = deal?.total_project_cost || closingRoom.allocation_amount || 0;
  const allocationAmount = closingRoom.allocation_amount || deal?.allocation_request || 0;

  // Calculate fees and credit economics
  const closingFee = calculateClosingFee(grossBasis);
  const effectiveRate = getEffectiveRate(grossBasis);

  // Calculate credit pricing (assuming market mid-price)
  const creditPricing = calculateCreditPricing({
    program: programType as CreditProgram,
    eligibleBasis: allocationAmount,
    creditPrice: 0.80, // Default to mid-market - would come from deal in production
  });

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'economics', label: 'Credit Economics', icon: '💰' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'participants', label: 'Participants', icon: '👥' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'compliance', label: 'Compliance', icon: '⚖️' },
  ];

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-100">{projectName}</h1>
                <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">
                  {closingRoom.status}
                </span>
                {closingRoom.has_open_issues && (
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
                    {closingRoom.issue_count} Issues
                  </span>
                )}
              </div>
              <p className="text-gray-400">
                {sponsorName} • {programType} • Deal ID: {dealId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors">
                Export Binder
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors">
                Mark as Closed
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Allocation</p>
              <p className="text-xl font-bold text-gray-100">${(allocationAmount / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Credits ({TOTAL_CREDITS[programType as CreditProgram] * 100}%)</p>
              <p className="text-xl font-bold text-green-400">${(creditPricing.totalCredits / 1_000_000).toFixed(2)}M</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Closing Fee</p>
              <p className="text-xl font-bold text-indigo-400">{formatFee(closingFee)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Checklist Progress</p>
              <p className="text-xl font-bold text-gray-100">{checklist?.progress.percentage || 0}%</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Target Close</p>
              <p className="text-xl font-bold text-gray-100">
                {closingRoom.target_close_date
                  ? new Date(closingRoom.target_close_date).toLocaleDateString()
                  : 'TBD'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-indigo-400 border-indigo-400'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Deal Lifecycle */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Deal Lifecycle</h2>
              <DealLifecycleTimeline current="closing_room" />
            </div>

            {/* Two column layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Fee Summary */}
              <div className="bg-indigo-900/20 rounded-xl p-6 border border-indigo-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Fee Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-indigo-800">
                    <span className="text-gray-400">Gross Basis</span>
                    <span className="text-xl font-bold text-white">${(grossBasis / 1_000_000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-indigo-800">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="text-xl font-bold text-green-400">{formatFee(closingFee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Effective Rate</span>
                    <span className="text-xl font-bold text-indigo-400">{effectiveRate.toFixed(3)}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Checklist */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Document Checklist</h2>
                <ClosingChecklist
                  completedIds={[]}
                  program={programType as 'NMTC' | 'HTC' | 'LIHTC' | 'OZ'}
                />
              </div>
            </div>

            {/* Issues (if any) */}
            {closingRoom.has_open_issues && closingRoom.closing_room_issues?.length > 0 && (
              <div className="bg-red-900/20 rounded-xl p-6 border border-red-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Open Issues</h2>
                <div className="space-y-3">
                  {closingRoom.closing_room_issues.filter(i => i.status !== 'resolved').map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-200">{issue.title}</p>
                        <span className={`text-xs ${
                          issue.priority === 'critical' ? 'text-red-400' :
                          issue.priority === 'high' ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {issue.priority.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{issue.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credit Economics Tab */}
        {activeTab === 'economics' && (
          <div className="space-y-8">
            {/* Credit Stream Summary */}
            <div className="bg-green-900/20 rounded-xl p-6 border border-green-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">
                {getProgramDisplayName(programType as CreditProgram)} Credit Economics
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Credit %</p>
                  <p className="text-3xl font-bold text-green-400">
                    {(TOTAL_CREDITS[programType as CreditProgram] * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">of eligible basis</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                  <p className="text-3xl font-bold text-white">
                    ${(creditPricing.totalCredits / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-gray-400 mt-1">available to investor</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Est. Investment</p>
                  <p className="text-3xl font-bold text-indigo-400">
                    ${(creditPricing.investmentAmount / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-gray-400 mt-1">at $0.80 price</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cash-on-Cash</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {formatCashOnCash(creditPricing.cashOnCash)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">indicative return</p>
                </div>
              </div>
            </div>

            {/* Credit Schedule */}
            {creditPricing.creditSchedule.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Credit Stream Schedule</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-700">
                        <th className="pb-3">Year</th>
                        <th className="pb-3">Credit %</th>
                        <th className="pb-3">Credit Amount</th>
                        <th className="pb-3">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditPricing.creditSchedule.map((item, idx) => {
                        const cumulative = creditPricing.creditSchedule
                          .slice(0, idx + 1)
                          .reduce((sum, i) => sum + i.amount, 0);
                        const pct = item.amount / allocationAmount;
                        return (
                          <tr key={item.year} className="border-b border-gray-700/50">
                            <td className="py-3 text-gray-300">Year {item.year}</td>
                            <td className="py-3 text-gray-300">{(pct * 100).toFixed(0)}%</td>
                            <td className="py-3 text-green-400">${(item.amount / 1000).toFixed(0)}K</td>
                            <td className="py-3 text-gray-400">${(cumulative / 1_000_000).toFixed(2)}M</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Price Sensitivity */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Price Sensitivity</h2>
              <p className="text-sm text-gray-400 mb-4">
                How cash-on-cash return changes with credit price (investor pays per $1 of credit)
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {[0.75, 0.80, 0.85].map((price) => {
                  const calc = calculateCreditPricing({
                    program: programType as CreditProgram,
                    eligibleBasis: allocationAmount,
                    creditPrice: price,
                  });
                  return (
                    <div key={price} className={`p-4 rounded-lg border ${
                      price === 0.80
                        ? 'bg-indigo-900/30 border-indigo-600'
                        : 'bg-gray-900/50 border-gray-700'
                    }`}>
                      <p className="text-sm text-gray-500">At {formatCreditPrice(price)}</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatCashOnCash(calc.cashOnCash)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Investment: ${(calc.investmentAmount / 1_000_000).toFixed(2)}M
                      </p>
                      {price === 0.80 && (
                        <span className="text-xs text-indigo-400">← Mid-market</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Note: Full IRR models are prepared by 3rd party accountants.
                Cash-on-Cash shown here is an indicative metric for comparison.
              </p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentVault
            documents={[]}
            programType={programType.toLowerCase() as 'nmtc' | 'htc' | 'lihtc' | 'oz'}
            canUpload={true}
            canReview={true}
          />
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <DealRoomParticipants
            participants={closingRoom.closing_room_participants || []}
            currentUserRole="sponsor"
            onInvite={() => console.log('Invite clicked')}
          />
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <ClosingTimeline
            events={closingRoom.closing_room_milestones || []}
            estimatedCloseDate={closingRoom.target_close_date ? new Date(closingRoom.target_close_date) : undefined}
          />
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-8">
            {/* QALICB Tests (NMTC-specific) */}
            {programType === 'NMTC' && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">QALICB Compliance Tests</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: 'Gross Income Test', status: 'pending', desc: '≥50% gross income from LIC activities' },
                    { name: 'Tangible Property Test', status: 'pending', desc: '≥40% tangible property in LIC' },
                    { name: 'Services Test', status: 'pending', desc: '≥40% services performed in LIC' },
                    { name: 'Collectibles Test', status: 'pending', desc: '<5% assets in collectibles' },
                    { name: 'NQFP Test', status: 'pending', desc: '<5% non-qualified financial property' },
                    { name: 'Sin Business Test', status: 'pending', desc: 'No prohibited business activities' },
                  ].map((test) => (
                    <div key={test.name} className="p-4 rounded-lg border bg-gray-800 border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-200">{test.name}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-600 text-gray-300">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{test.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Deadlines */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Compliance Deadlines</h2>
              <div className="space-y-3">
                {closingRoom.target_close_date && (
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-200">Target Close Date</p>
                      <p className="text-sm text-gray-500">
                        {new Date(closingRoom.target_close_date).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className="text-sm text-amber-400">
                      {Math.ceil((new Date(closingRoom.target_close_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
