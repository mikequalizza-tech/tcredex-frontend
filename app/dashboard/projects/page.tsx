'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  address: string;
  censusTract: string;
  status: 'draft' | 'submitted' | 'matched' | 'term_sheet' | 'closing' | 'closed';
  projectCost: number;
  nmtcRequested: number;
  submittedAt?: string;
  matchCount?: number;
}

const demoProjects: Project[] = [
  {
    id: 'P001',
    name: 'Community Health Center',
    address: '123 Main St, Springfield, IL',
    censusTract: '17031010100',
    status: 'matched',
    projectCost: 8500000,
    nmtcRequested: 6000000,
    submittedAt: '2024-11-15',
    matchCount: 4,
  },
  {
    id: 'P002',
    name: 'Downtown Grocery Store',
    address: '456 Market Ave, Detroit, MI',
    censusTract: '26163520100',
    status: 'term_sheet',
    projectCost: 5200000,
    nmtcRequested: 3500000,
    submittedAt: '2024-10-20',
    matchCount: 2,
  },
  {
    id: 'P003',
    name: 'Youth Training Center',
    address: '789 Oak Blvd, Memphis, TN',
    censusTract: '47157003900',
    status: 'draft',
    projectCost: 3800000,
    nmtcRequested: 2500000,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-700 text-gray-300' },
  submitted: { label: 'Submitted', color: 'bg-blue-900/50 text-blue-300' },
  matched: { label: 'Matched', color: 'bg-purple-900/50 text-purple-300' },
  term_sheet: { label: 'Term Sheet', color: 'bg-amber-900/50 text-amber-300' },
  closing: { label: 'Closing', color: 'bg-indigo-900/50 text-indigo-300' },
  closed: { label: 'Closed', color: 'bg-green-900/50 text-green-300' },
};

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(demoProjects);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : projects.filter(p => p.status === filterStatus);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Projects</h1>
          <p className="text-gray-400 mt-1">Manage your submitted projects and track their progress.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'draft', 'submitted', 'matched', 'term_sheet', 'closing', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All Projects' : statusConfig[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-100">{project.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[project.status].color}`}>
                    {statusConfig[project.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{project.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Census Tract: <span className="font-mono">{project.censusTract}</span>
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">Project Cost</p>
                <p className="text-xl font-bold text-indigo-400">{formatCurrency(project.projectCost)}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">NMTC Requested:</span>
                  <span className="ml-2 text-gray-300">{formatCurrency(project.nmtcRequested)}</span>
                </div>
                {project.submittedAt && (
                  <div>
                    <span className="text-gray-500">Submitted:</span>
                    <span className="ml-2 text-gray-300">{project.submittedAt}</span>
                  </div>
                )}
                {project.matchCount && project.matchCount > 0 && (
                  <div>
                    <span className="text-gray-500">Matches:</span>
                    <span className="ml-2 text-purple-400 font-medium">{project.matchCount} CDEs</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {project.status === 'draft' && (
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Continue Editing
                  </Link>
                )}
                {project.status !== 'draft' && (
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                  >
                    View Details
                  </Link>
                )}
                {project.status === 'matched' && (
                  <Link
                    href={`/dashboard/projects/${project.id}/matches`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                  >
                    View Matches
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects found.</p>
            <Link
              href="/dashboard/projects/new"
              className="mt-4 inline-block px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
            >
              Submit Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
