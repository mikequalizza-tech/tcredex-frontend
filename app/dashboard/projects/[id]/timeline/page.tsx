'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

// Demo timeline events
const timelineEvents = [
  {
    id: 1,
    type: 'status_change',
    title: 'Project moved to Matched',
    description: 'Project status updated after receiving CDE interest',
    timestamp: '2024-12-10T14:30:00Z',
    user: 'System',
  },
  {
    id: 2,
    type: 'match',
    title: 'CDE Match Received',
    description: 'Midwest Community Development Fund expressed interest (92% match)',
    timestamp: '2024-12-10T12:15:00Z',
    user: 'AutoMatch AI',
  },
  {
    id: 3,
    type: 'document',
    title: 'Document Uploaded',
    description: 'Phase I Environmental Assessment added',
    timestamp: '2024-12-08T09:45:00Z',
    user: 'John Smith',
  },
  {
    id: 4,
    type: 'match',
    title: 'CDE Match Received',
    description: 'Urban Development Fund is reviewing the project',
    timestamp: '2024-12-07T16:20:00Z',
    user: 'AutoMatch AI',
  },
  {
    id: 5,
    type: 'document',
    title: 'Document Uploaded',
    description: 'Project Budget v2 added',
    timestamp: '2024-12-05T11:30:00Z',
    user: 'John Smith',
  },
  {
    id: 6,
    type: 'status_change',
    title: 'Project Submitted',
    description: 'Project submitted for CDE matching',
    timestamp: '2024-12-01T08:00:00Z',
    user: 'John Smith',
  },
  {
    id: 7,
    type: 'created',
    title: 'Project Created',
    description: 'Initial project intake completed',
    timestamp: '2024-11-28T10:15:00Z',
    user: 'John Smith',
  },
];

const eventTypeConfig: Record<string, { icon: string; color: string }> = {
  status_change: { icon: '🔄', color: 'bg-indigo-500' },
  match: { icon: '🤝', color: 'bg-purple-500' },
  document: { icon: '📄', color: 'bg-blue-500' },
  created: { icon: '✨', color: 'bg-green-500' },
  comment: { icon: '💬', color: 'bg-gray-500' },
};

export default function ProjectTimelinePage() {
  const params = useParams();
  const projectId = (params?.id ?? '') as string;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/projects" className="text-gray-400 hover:text-white">
          Projects
        </Link>
        <span className="text-gray-600">/</span>
        <Link href={`/dashboard/projects/${projectId}`} className="text-gray-400 hover:text-white">
          Project Details
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Timeline</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Project Timeline</h1>
          <p className="text-gray-400">
            Complete history of project activity and milestones
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <Link 
          href={`/dashboard/projects/${projectId}`}
          className="pb-3 px-2 text-sm font-medium text-gray-400 hover:text-white"
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
          className="pb-3 px-2 text-sm font-medium text-indigo-400 border-b-2 border-indigo-500"
        >
          Timeline
        </Link>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />

        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${eventTypeConfig[event.type]?.color || 'bg-gray-700'}`}>
                <span className="text-xl">{eventTypeConfig[event.type]?.icon || '📌'}</span>
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-100">{event.title}</h3>
                  <div className="text-right text-sm">
                    <p className="text-gray-400">{formatDate(event.timestamp)}</p>
                    <p className="text-gray-500">{formatTime(event.timestamp)}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">{event.description}</p>
                <p className="text-xs text-gray-500">by {event.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
