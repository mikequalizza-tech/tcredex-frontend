'use client';

import { useState, use } from 'react';
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

type TabType = 'overview' | 'documents' | 'participants' | 'timeline' | 'compliance';

interface ClosingRoomPageProps {
  params: Promise<{ id: string }>;
}

// Demo data - in production these would come from API
const demoParticipants: Participant[] = [
  { id: '1', name: 'Sarah Mitchell', email: 'sarah@sponsor.com', organization: 'Community Development Corp', role: 'sponsor', accessLevel: 'admin' },
  { id: '2', name: 'Michael Chen', email: 'mchen@cdefund.com', organization: 'Metro CDE Fund', role: 'cde', accessLevel: 'edit' },
  { id: '3', name: 'Jessica Williams', email: 'jwilliams@bankpartners.com', organization: 'First Community Bank', role: 'investor', accessLevel: 'edit' },
  { id: '4', name: 'David Park', email: 'dpark@legalcounsel.com', organization: 'Park & Associates LLP', role: 'counsel', accessLevel: 'view' },
];

const demoDocuments: ClosingDocument[] = [
  { id: '1', name: 'Articles of Incorporation', category: 'corporate', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-01'), version: 1 },
  { id: '2', name: 'Board Resolution', category: 'corporate', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-01'), version: 1 },
  { id: '3', name: 'Business Plan', category: 'project', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-05'), version: 2, fileType: 'pdf' },
  { id: '4', name: 'Site Photos & Maps', category: 'project', status: 'uploaded', required: false, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-10'), version: 1, fileType: 'pdf' },
  { id: '5', name: 'Financial Projections', category: 'financial', status: 'under_review', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-15'), version: 1, fileType: 'xlsx', aiFlags: ['Interest rate assumptions may be outdated'] },
  { id: '6', name: 'Audited Financials (3 Years)', category: 'financial', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-08'), version: 1, fileType: 'pdf' },
  { id: '7', name: 'Phase I Environmental Report', category: 'real_estate', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-12'), version: 1, fileType: 'pdf' },
  { id: '8', name: 'Title Policy', category: 'real_estate', status: 'pending', required: true, uploadedBy: undefined, version: 1 },
  { id: '9', name: 'QALICB Certification', category: 'qalicb', status: 'approved', required: true, uploadedBy: 'Sarah Mitchell', uploadedAt: new Date('2024-11-03'), version: 1, fileType: 'pdf' },
  { id: '10', name: 'NMTC Allocation Agreement', category: 'closing', status: 'pending', required: true, version: 1 },
  { id: '11', name: 'Loan Agreement (Draft)', category: 'closing', status: 'uploaded', required: true, uploadedBy: 'David Park', uploadedAt: new Date('2024-11-18'), version: 3, fileType: 'docx', aiFlags: ['Fee structure differs from term sheet by 0.15%'] },
];

const demoTimelineEvents: TimelineEvent[] = [
  { id: '1', type: 'intake_submitted', title: 'Project Intake Submitted', date: new Date('2024-10-01'), status: 'completed', completedBy: 'Sarah Mitchell' },
  { id: '2', type: 'deal_matched', title: 'Matched with Metro CDE Fund', date: new Date('2024-10-15'), status: 'completed', completedBy: 'AutoMatch AI' },
  { id: '3', type: 'loi_received', title: 'Letter of Intent Received', date: new Date('2024-10-22'), status: 'completed', completedBy: 'Michael Chen' },
  { id: '4', type: 'term_sheet_signed', title: 'Term Sheet Executed', date: new Date('2024-11-01'), status: 'completed', description: 'Final terms agreed: $10M allocation at 0.92 credit price' },
  { id: '5', type: 'due_diligence_start', title: 'Due Diligence Commenced', date: new Date('2024-11-05'), status: 'completed' },
  { id: '6', type: 'compliance_check', title: 'QALICB Compliance Review', date: new Date('2024-11-10'), status: 'current', assignedTo: 'Michael Chen', description: 'Verifying all NMTC eligibility tests' },
  { id: '7', type: 'closing_scheduled', title: 'Closing Call Scheduled', date: new Date('2024-12-15'), status: 'upcoming', assignedTo: 'David Park' },
  { id: '8', type: 'funds_transfer', title: 'Funds Transfer', date: new Date('2024-12-18'), status: 'upcoming' },
  { id: '9', type: 'deal_closed', title: 'Deal Closed', date: new Date('2024-12-20'), status: 'upcoming' },
];

export default function ClosingRoomPage({ params }: ClosingRoomPageProps) {
  const { id: dealId } = use(params);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Demo data
  const dealData = {
    projectName: 'Riverside Community Center',
    sponsor: 'Community Development Corp',
    programType: 'NMTC' as const,
    grossBasis: 15_000_000,
    nmtcAllocation: 10_000_000,
    creditPrice: 0.92,
    estimatedCloseDate: new Date('2024-12-20'),
    status: 'In Closing',
    completedDocs: [1, 2, 3, 6, 7, 9],
  };

  const closingFee = calculateClosingFee(dealData.grossBasis);
  const effectiveRate = getEffectiveRate(dealData.grossBasis);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
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
                <h1 className="text-2xl font-bold text-gray-100">{dealData.projectName}</h1>
                <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">
                  {dealData.status}
                </span>
              </div>
              <p className="text-gray-400">
                {dealData.sponsor} • {dealData.programType} • Deal ID: {dealId}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">NMTC Allocation</p>
              <p className="text-xl font-bold text-gray-100">${(dealData.nmtcAllocation / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Credit Price</p>
              <p className="text-xl font-bold text-green-400">${dealData.creditPrice.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Closing Fee</p>
              <p className="text-xl font-bold text-indigo-400">{formatFee(closingFee)}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Est. Close Date</p>
              <p className="text-xl font-bold text-gray-100">{dealData.estimatedCloseDate.toLocaleDateString()}</p>
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
                    <span className="text-xl font-bold text-white">${(dealData.grossBasis / 1_000_000).toFixed(1)}M</span>
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
                <ClosingChecklist completedIds={dealData.completedDocs} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {demoTimelineEvents.slice(-5).reverse().map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      event.status === 'completed' ? 'bg-green-500' :
                      event.status === 'current' ? 'bg-indigo-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.date.toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs ${
                      event.status === 'completed' ? 'text-green-400' :
                      event.status === 'current' ? 'text-indigo-400' :
                      'text-gray-500'
                    }`}>
                      {event.status === 'completed' ? '✓ Complete' :
                       event.status === 'current' ? '● Active' : 'Upcoming'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentVault 
            documents={demoDocuments}
            programType="nmtc"
            canUpload={true}
            canReview={true}
          />
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <DealRoomParticipants 
            participants={demoParticipants}
            currentUserRole="sponsor"
            onInvite={() => console.log('Invite clicked')}
          />
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <ClosingTimeline 
            events={demoTimelineEvents}
            estimatedCloseDate={dealData.estimatedCloseDate}
          />
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-8">
            {/* QALICB Tests */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">QALICB Compliance Tests</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Gross Income Test', status: 'pass', desc: '≥50% gross income from LIC activities' },
                  { name: 'Tangible Property Test', status: 'pass', desc: '≥40% tangible property in LIC' },
                  { name: 'Services Test', status: 'pass', desc: '≥40% services performed in LIC' },
                  { name: 'Collectibles Test', status: 'pass', desc: '<5% assets in collectibles' },
                  { name: 'NQFP Test', status: 'pass', desc: '<5% non-qualified financial property' },
                  { name: 'Sin Business Test', status: 'pass', desc: 'No prohibited business activities' },
                ].map((test) => (
                  <div key={test.name} className={`p-4 rounded-lg border ${
                    test.status === 'pass' ? 'bg-green-900/20 border-green-700' :
                    test.status === 'fail' ? 'bg-red-900/20 border-red-700' :
                    'bg-gray-800 border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-200">{test.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        test.status === 'pass' ? 'bg-green-600 text-white' :
                        'bg-red-600 text-white'
                      }`}>
                        {test.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{test.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Census Tract Info */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Census Tract Qualification</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Census Tract</p>
                  <p className="text-xl font-bold text-gray-100">17031842400</p>
                  <p className="text-sm text-green-400 mt-1">✓ NMTC Eligible</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Poverty Rate</p>
                  <p className="text-xl font-bold text-amber-400">28.4%</p>
                  <p className="text-sm text-gray-400 mt-1">Threshold: 20%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Median Family Income</p>
                  <p className="text-xl font-bold text-gray-100">$32,450</p>
                  <p className="text-sm text-gray-400 mt-1">58% of AMI</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-300 text-sm">
                  ✓ Severely Distressed Community - Qualifies for priority consideration
                </p>
              </div>
            </div>

            {/* Compliance Deadlines */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Compliance Deadlines</h2>
              <div className="space-y-3">
                {[
                  { name: 'QEI Close', date: 'Dec 20, 2024', status: 'upcoming', daysLeft: 7 },
                  { name: 'Year 1 QALICB Certification', date: 'Dec 20, 2025', status: 'future', daysLeft: 372 },
                  { name: 'Year 7 Exit (Put/Call)', date: 'Dec 20, 2031', status: 'future', daysLeft: 2557 },
                ].map((deadline) => (
                  <div key={deadline.name} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-200">{deadline.name}</p>
                      <p className="text-sm text-gray-500">{deadline.date}</p>
                    </div>
                    <span className={`text-sm ${
                      deadline.daysLeft < 30 ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {deadline.daysLeft} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
