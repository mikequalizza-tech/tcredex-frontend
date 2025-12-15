'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type DocumentCategory = 'all' | 'corporate' | 'project' | 'financial' | 'real_estate' | 'legal' | 'qalicb' | 'insurance' | 'closing';
type DocumentStatus = 'all' | 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired';

interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  projectName: string;
  projectId: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  version: number;
  aiFlags?: string[];
  // Add mock URL for demo
  fileUrl?: string;
}

const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    name: 'Certificate of Formation.pdf',
    category: 'corporate',
    status: 'approved',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'John Smith',
    uploadedDate: '2024-11-15',
    size: '1.2 MB',
    version: 1,
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-002',
    name: 'Operating Agreement.pdf',
    category: 'corporate',
    status: 'approved',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'John Smith',
    uploadedDate: '2024-11-15',
    size: '3.4 MB',
    version: 2,
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-003',
    name: 'Phase I Environmental.pdf',
    category: 'real_estate',
    status: 'under_review',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'Jane Doe',
    uploadedDate: '2024-12-01',
    size: '8.7 MB',
    version: 1,
    aiFlags: ['Report date is more than 6 months old'],
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-004',
    name: 'Appraisal Report.pdf',
    category: 'real_estate',
    status: 'approved',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'Jane Doe',
    uploadedDate: '2024-11-20',
    size: '5.2 MB',
    version: 1,
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-005',
    name: 'Pro Forma Financial Model.xlsx',
    category: 'financial',
    status: 'under_review',
    projectName: 'Heritage Theater Restoration',
    projectId: 'deal-002',
    uploadedBy: 'Mike Johnson',
    uploadedDate: '2024-12-05',
    size: '2.1 MB',
    version: 3,
    aiFlags: ['Interest rate assumptions may be outdated'],
    fileUrl: '/documents/sample.xlsx',
  },
  {
    id: 'doc-006',
    name: 'Construction Budget.xlsx',
    category: 'financial',
    status: 'pending',
    projectName: 'Heritage Theater Restoration',
    projectId: 'deal-002',
    uploadedBy: '',
    uploadedDate: '',
    size: '',
    version: 0,
  },
  {
    id: 'doc-007',
    name: 'Title Insurance Commitment.pdf',
    category: 'real_estate',
    status: 'uploaded',
    projectName: 'Heritage Theater Restoration',
    projectId: 'deal-002',
    uploadedBy: 'Sarah Williams',
    uploadedDate: '2024-12-08',
    size: '4.3 MB',
    version: 1,
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-008',
    name: 'QALICB Certification.pdf',
    category: 'qalicb',
    status: 'approved',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'Legal Team',
    uploadedDate: '2024-11-25',
    size: '1.8 MB',
    version: 1,
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-009',
    name: 'General Liability Insurance.pdf',
    category: 'insurance',
    status: 'expired',
    projectName: 'Downtown Community Center',
    projectId: 'deal-001',
    uploadedBy: 'Insurance Dept',
    uploadedDate: '2024-06-01',
    size: '0.9 MB',
    version: 1,
    aiFlags: ['Policy expired - renewal required'],
    fileUrl: '/documents/sample.pdf',
  },
  {
    id: 'doc-010',
    name: 'Term Sheet - Executed.pdf',
    category: 'legal',
    status: 'approved',
    projectName: 'Heritage Theater Restoration',
    projectId: 'deal-002',
    uploadedBy: 'Legal Team',
    uploadedDate: '2024-11-10',
    size: '0.5 MB',
    version: 2,
    fileUrl: '/documents/sample.pdf',
  },
];

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  all: 'All Categories',
  corporate: 'Corporate',
  project: 'Project',
  financial: 'Financial',
  real_estate: 'Real Estate',
  legal: 'Legal',
  qalicb: 'QALICB',
  insurance: 'Insurance',
  closing: 'Closing',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  all: '',
  pending: 'bg-gray-100 text-gray-700',
  uploaded: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  all: 'All Status',
  pending: 'Pending',
  uploaded: 'Uploaded',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export default function DocumentsPage() {
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Filter documents
  const filteredDocs = DEMO_DOCUMENTS.filter((doc) => {
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !doc.projectName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: DEMO_DOCUMENTS.length,
    pending: DEMO_DOCUMENTS.filter(d => d.status === 'pending').length,
    underReview: DEMO_DOCUMENTS.filter(d => d.status === 'under_review').length,
    approved: DEMO_DOCUMENTS.filter(d => d.status === 'approved').length,
    aiFlags: DEMO_DOCUMENTS.filter(d => d.aiFlags && d.aiFlags.length > 0).length,
  };

  // Handle preview
  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
  };

  // Handle download
  const handleDownload = (doc: Document) => {
    // For demo, we'll create a simple text file to download
    // In production, this would fetch the actual file
    const content = `Document: ${doc.name}\nProject: ${doc.projectName}\nCategory: ${doc.category}\nStatus: ${doc.status}\nUploaded: ${doc.uploadedDate}\nUploaded By: ${doc.uploadedBy}\nSize: ${doc.size}\nVersion: ${doc.version}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.replace('.pdf', '.txt').replace('.xlsx', '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Manage all documents across your projects</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Documents</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending Upload</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-amber-600">{stats.underReview}</div>
          <div className="text-sm text-gray-500">Under Review</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.aiFlags}</div>
          <div className="text-sm text-gray-500">AI Flags</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documents or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {doc.name.endsWith('.pdf') ? (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.name}</div>
                        {doc.version > 1 && (
                          <div className="text-xs text-gray-500">v{doc.version}</div>
                        )}
                        {doc.aiFlags && doc.aiFlags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-xs text-amber-600">{doc.aiFlags[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/deals/${doc.projectId}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {doc.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 capitalize">{doc.category.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                      {STATUS_LABELS[doc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {doc.uploadedDate ? (
                      <div>
                        <div className="text-sm text-gray-900">{doc.uploadedDate}</div>
                        <div className="text-xs text-gray-500">{doc.uploadedBy}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {doc.size || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {doc.status === 'pending' ? (
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Upload
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Preview Button */}
                        <button 
                          onClick={() => handlePreview(doc)}
                          className="text-gray-600 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Preview document"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Download Button */}
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="text-gray-600 hover:text-green-600 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Download document"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocs.length === 0 && (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No documents found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewDoc(null)} />
          <div className="relative bg-white rounded-xl w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  {previewDoc.name.endsWith('.pdf') ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{previewDoc.name}</h3>
                  <p className="text-sm text-gray-500">{previewDoc.projectName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Document Preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              <div className="bg-white rounded-lg shadow-sm p-8 min-h-[500px] flex flex-col items-center justify-center">
                {/* Demo preview content */}
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    {previewDoc.name.endsWith('.pdf') ? (
                      <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{previewDoc.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <p><span className="text-gray-500">Project:</span> {previewDoc.projectName}</p>
                    <p><span className="text-gray-500">Category:</span> {previewDoc.category.replace('_', ' ')}</p>
                    <p><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[previewDoc.status]}`}>{STATUS_LABELS[previewDoc.status]}</span></p>
                    <p><span className="text-gray-500">Size:</span> {previewDoc.size}</p>
                    <p><span className="text-gray-500">Version:</span> {previewDoc.version}</p>
                    <p><span className="text-gray-500">Uploaded:</span> {previewDoc.uploadedDate} by {previewDoc.uploadedBy}</p>
                  </div>
                  
                  {previewDoc.aiFlags && previewDoc.aiFlags.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        AI Flags
                      </div>
                      <ul className="text-sm text-amber-600">
                        {previewDoc.aiFlags.map((flag, i) => (
                          <li key={i}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm text-gray-400">
                    Document preview will display here when connected to file storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploadModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option>Downtown Community Center</option>
                  <option>Heritage Theater Restoration</option>
                  <option>Affordable Housing Complex</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== 'all').map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Drag and drop or <span className="text-green-600 cursor-pointer">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLSX up to 50MB</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
