'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VersionHistory from '@/components/documents/VersionHistory';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ShareModal from '@/components/documents/ShareModal';
import { Document, DocumentVersion, DOCUMENT_CATEGORIES, formatFileSize, DocumentShare } from '@/lib/documents/types';

// Demo document with versions
const demoDocument: Document = {
  id: 'doc1',
  name: 'Phase I Environmental Assessment',
  description: 'Environmental site assessment for Eastside Grocery Co-Op project. Includes soil testing, groundwater analysis, and historical use review.',
  category: 'environmental',
  entityType: 'project',
  entityId: 'P001',
  entityName: 'Eastside Grocery Co-Op',
  currentVersion: {
    id: 'v1-3',
    versionNumber: 3,
    fileName: 'Phase_I_ESA_EastsideGrocery_v3.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
    uploadedAt: '2024-12-10T14:30:00Z',
    changeNotes: 'Updated with additional soil testing results from northeast corner of site',
    checksum: 'abc123def456789xyz',
    storageUrl: '/documents/phase1-esa-v3.pdf',
  },
  versionCount: 3,
  owner: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
  organizationId: 'org1',
  shares: [
    {
      id: 's1',
      sharedWith: { type: 'organization', id: 'o1', name: 'Midwest CDE' },
      accessLevel: 'viewer',
      sharedBy: { id: 'u1', name: 'John Smith' },
      sharedAt: '2024-12-05T10:00:00Z',
      canReshare: false,
    },
    {
      id: 's2',
      sharedWith: { type: 'user', id: 'u3', name: 'Sarah Johnson' },
      accessLevel: 'editor',
      sharedBy: { id: 'u1', name: 'John Smith' },
      sharedAt: '2024-12-08T15:30:00Z',
      canReshare: true,
    },
  ],
  isPublic: false,
  tags: ['Environmental', 'Compliance', 'Closing', 'Impact'],
  status: 'approved',
  requiredForClosing: true,
  createdAt: '2024-11-15T09:00:00Z',
  updatedAt: '2024-12-10T14:30:00Z',
};

// Demo version history
const demoVersions: DocumentVersion[] = [
  {
    id: 'v1-3',
    versionNumber: 3,
    fileName: 'Phase_I_ESA_EastsideGrocery_v3.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
    uploadedAt: '2024-12-10T14:30:00Z',
    changeNotes: 'Updated with additional soil testing results from northeast corner of site',
    checksum: 'abc123def456789xyz',
    storageUrl: '/documents/phase1-esa-v3.pdf',
  },
  {
    id: 'v1-2',
    versionNumber: 2,
    fileName: 'Phase_I_ESA_EastsideGrocery_v2.pdf',
    fileSize: 2234567,
    mimeType: 'application/pdf',
    uploadedBy: { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com' },
    uploadedAt: '2024-12-01T09:15:00Z',
    changeNotes: 'Added historical use documentation and interview summaries',
    checksum: 'def789ghi012345abc',
    storageUrl: '/documents/phase1-esa-v2.pdf',
  },
  {
    id: 'v1-1',
    versionNumber: 1,
    fileName: 'Phase_I_ESA_EastsideGrocery_v1.pdf',
    fileSize: 1987654,
    mimeType: 'application/pdf',
    uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
    uploadedAt: '2024-11-15T09:00:00Z',
    checksum: 'ghi345jkl678901def',
    storageUrl: '/documents/phase1-esa-v1.pdf',
  },
];

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document>(demoDocument);
  const [versions] = useState<DocumentVersion[]>(demoVersions);
  const [showUploadVersion, setShowUploadVersion] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'activity'>('details');

  const category = DOCUMENT_CATEGORIES[document.category];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    switch (document.status) {
      case 'approved': return 'bg-green-900/50 text-green-300 border-green-500/30';
      case 'pending_review': return 'bg-amber-900/50 text-amber-300 border-amber-500/30';
      case 'draft': return 'bg-gray-800 text-gray-400 border-gray-700';
      case 'archived': return 'bg-gray-900 text-gray-500 border-gray-800';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const handleVersionUploadComplete = () => {
    setShowUploadVersion(false);
    // TODO: Refresh document data
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    // TODO: API call to restore version
    alert(`Restored to version ${version.versionNumber}`);
  };

  const handleDownloadVersion = (version: DocumentVersion) => {
    // TODO: Trigger download
    window.open(version.storageUrl, '_blank');
  };

  const handleShare = (share: Omit<DocumentShare, 'id' | 'sharedAt' | 'sharedBy'>) => {
    const newShare: DocumentShare = {
      ...share,
      id: `s${Date.now()}`,
      sharedAt: new Date().toISOString(),
      sharedBy: { id: 'u1', name: 'John Smith' },
    };
    setDocument({ ...document, shares: [...document.shares, newShare] });
  };

  const handleRemoveShare = (shareId: string) => {
    setDocument({ ...document, shares: document.shares.filter(s => s.id !== shareId) });
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard/documents" className="text-gray-400 hover:text-white">
            Documents
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-200">{document.name}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-3xl">
              📄
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-100">{document.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                  {document.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-gray-400 mb-3">{document.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded bg-${category.color}-900/30 text-${category.color}-300`}>
                  {category.label}
                </span>
                <span>v{document.currentVersion.versionNumber}</span>
                <span>{formatFileSize(document.currentVersion.fileSize)}</span>
                <span>Updated {formatDate(document.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button
              onClick={() => setShowUploadVersion(true)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Version
            </button>
            <a
              href={document.currentVersion.storageUrl}
              download
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        </div>

        {/* Entity Link */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Associated with: 
            <Link 
              href={`/dashboard/${document.entityType}s/${document.entityId}`}
              className="ml-2 text-indigo-400 hover:text-indigo-300"
            >
              {document.entityName}
            </Link>
            <span className="text-gray-600 ml-1">({document.entityType})</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        {(['details', 'versions', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'details' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Document Details</h2>
              
              <dl className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">File Name</dt>
                    <dd className="text-gray-200 font-mono text-sm mt-1">{document.currentVersion.fileName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">File Size</dt>
                    <dd className="text-gray-200 mt-1">{formatFileSize(document.currentVersion.fileSize)}</dd>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Category</dt>
                    <dd className="text-gray-200 mt-1">{category.label}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-gray-200 mt-1 capitalize">{document.status.replace('_', ' ')}</dd>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="text-gray-200 mt-1">{formatDate(document.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Last Updated</dt>
                    <dd className="text-gray-200 mt-1">{formatDate(document.updatedAt)}</dd>
                  </div>
                </div>

                <div>
                  <dt className="text-sm text-gray-500">Owner</dt>
                  <dd className="text-gray-200 mt-1">{document.owner.name} ({document.owner.email})</dd>
                </div>

                <div>
                  <dt className="text-sm text-gray-500 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>

                {document.requiredForClosing && (
                  <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      This document is required for closing
                    </p>
                  </div>
                )}
              </dl>
            </div>
          )}

          {activeTab === 'versions' && (
            <VersionHistory
              versions={versions}
              currentVersionId={document.currentVersion.id}
              onRestore={handleRestoreVersion}
              onDownload={handleDownloadVersion}
              canRestore={true}
            />
          )}

          {activeTab === 'activity' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Activity Log</h2>
              
              <div className="space-y-4">
                {[
                  { action: 'Version 3 uploaded', user: 'John Smith', time: '2024-12-10 2:30 PM' },
                  { action: 'Shared with Midwest CDE', user: 'John Smith', time: '2024-12-05 10:00 AM' },
                  { action: 'Version 2 uploaded', user: 'Sarah Johnson', time: '2024-12-01 9:15 AM' },
                  { action: 'Status changed to Approved', user: 'Admin', time: '2024-11-20 3:45 PM' },
                  { action: 'Document created', user: 'John Smith', time: '2024-11-15 9:00 AM' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm text-gray-200">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shared With */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-200">Shared With</h3>
              <button
                onClick={() => setShowShareModal(true)}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                  {document.owner.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{document.owner.name}</p>
                  <p className="text-xs text-green-400">Owner</p>
                </div>
              </div>

              {document.shares.map((share) => (
                <div key={share.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    share.sharedWith.type === 'organization' ? 'bg-purple-600' : 'bg-indigo-600'
                  }`}>
                    {share.sharedWith.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{share.sharedWith.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{share.accessLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-medium text-gray-200 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Versions</span>
                <span className="text-sm text-gray-200">{document.versionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Shares</span>
                <span className="text-sm text-gray-200">{document.shares.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Downloads</span>
                <span className="text-sm text-gray-200">24</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Version Modal */}
      {showUploadVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <DocumentUploader
              entityType={document.entityType}
              entityId={document.entityId}
              entityName={document.entityName}
              onUploadComplete={handleVersionUploadComplete}
              onCancel={() => setShowUploadVersion(false)}
              isNewVersion={true}
              existingDocumentId={document.id}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          document={document}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
          onRemoveShare={handleRemoveShare}
        />
      )}
    </div>
  );
}
