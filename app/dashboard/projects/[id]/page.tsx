'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

// Demo project data
const demoProjects: Record<string, {
  name: string;
  status: string;
  address: string;
  censusTract: string;
  projectCost: number;
  nmtcRequested: number;
  sponsor: string;
  submittedAt: string;
  matchCount: number;
}> = {
  'P001': {
    name: 'Eastside Grocery Co-Op',
    status: 'matched',
    address: '123 Main St, Springfield, IL 62701',
    censusTract: '17031010100',
    projectCost: 7200000,
    nmtcRequested: 5000000,
    sponsor: 'Local Roots Foundation',
    submittedAt: '2024-11-15',
    matchCount: 4,
  },
  'P002': {
    name: 'Northgate Health Center',
    status: 'term_sheet',
    address: '456 Health Ave, Detroit, MI 48201',
    censusTract: '26163520100',
    projectCost: 12500000,
    nmtcRequested: 8000000,
    sponsor: 'Community Health Partners',
    submittedAt: '2024-10-20',
    matchCount: 2,
  },
  'P003': {
    name: 'Youth Training Center',
    status: 'draft',
    address: '789 Oak Blvd, Memphis, TN 38103',
    censusTract: '47157003900',
    projectCost: 3800000,
    nmtcRequested: 2500000,
    sponsor: 'Memphis Youth Services',
    submittedAt: '',
    matchCount: 0,
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-700 text-gray-300' },
  submitted: { label: 'Submitted', color: 'bg-blue-900/50 text-blue-300' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-300' },
  term_sheet: { label: 'Term Sheet', color: 'bg-amber-900/50 text-amber-300' },
  closing: { label: 'Closing', color: 'bg-indigo-900/50 text-indigo-300' },
  closed: { label: 'Closed', color: 'bg-green-900/50 text-green-300' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = (params?.id ?? '') as string;
  const project = demoProjects[projectId];

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-100">Project Not Found</h1>
        <Link href="/dashboard/projects" className="text-indigo-400 mt-4 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/projects" className="text-gray-400 hover:text-white">
          Projects
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-100">{project.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[project.status].color}`}>
              {statusConfig[project.status].label}
            </span>
          </div>
          <p className="text-gray-400">{project.address}</p>
        </div>
        <div className="flex gap-2">
          {project.status === 'draft' && (
            <Link
              href={`/dashboard/projects/${projectId}/edit`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Edit Project
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${projectId}/documents`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Documents
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Project Cost</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(project.projectCost)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">NMTC Requested</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(project.nmtcRequested)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Census Tract</p>
          <p className="text-lg font-mono text-gray-200">{project.censusTract}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">CDE Matches</p>
          <p className="text-2xl font-bold text-purple-400">{project.matchCount}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <Link 
          href={`/dashboard/projects/${projectId}`}
          className="pb-3 px-2 text-sm font-medium text-indigo-400 border-b-2 border-indigo-500"
        >
          Overview
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/documents`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Documents
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/matches`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Matches
        </Link>
        <Link 
          href={`/dashboard/projects/${projectId}/timeline`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Timeline
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Project Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Sponsor</dt>
                <dd className="text-gray-200">{project.sponsor}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Submitted</dt>
                <dd className="text-gray-200">{project.submittedAt || 'Not submitted'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Address</dt>
                <dd className="text-gray-200">{project.address}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Census Tract</dt>
                <dd className="text-gray-200 font-mono">{project.censusTract}</dd>
              </div>
            </dl>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'Document uploaded', detail: 'Phase I Environmental', time: '2 hours ago' },
                { action: 'Match received', detail: 'From Midwest CDE', time: '1 day ago' },
                { action: 'Status changed', detail: 'Moved to Matched', time: '2 days ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-200">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.detail} • {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-medium text-gray-200 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/projects/${projectId}/documents`}
                className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Manage Documents
              </Link>
              <Link
                href={`/dashboard/projects/${projectId}/matches`}
                className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                View Matches
              </Link>
              <Link
                href={`/dashboard/documents/new?entityType=project&entityId=${projectId}`}
                className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Document
              </Link>
            </div>
          </div>

          {/* Document Summary */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-200">Documents</h3>
              <Link 
                href={`/dashboard/projects/${projectId}/documents`}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                View All
              </Link>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="text-gray-200">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Approved</span>
                <span className="text-green-400">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pending</span>
                <span className="text-amber-400">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
