'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DocumentCard from '@/components/documents/DocumentCard';
import ShareModal from '@/components/documents/ShareModal';
import { 
  Document, 
  DocumentCategory, 
  DOCUMENT_CATEGORIES, 
  DOCUMENT_TAGS, 
  DocumentTag, 
  TAG_COLORS,
  DocumentShare,
} from '@/lib/documents/types';

// Demo project data
const demoProjects: Record<string, { name: string; status: string }> = {
  'P001': { name: 'Eastside Grocery Co-Op', status: 'matched' },
  'P002': { name: 'Northgate Health Center', status: 'term_sheet' },
  'P003': { name: 'Youth Training Center', status: 'draft' },
};

// Demo documents for this project
const getProjectDocuments = (projectId: string): Document[] => {
  if (projectId === 'P001') {
    return [
      {
        id: 'pdoc1',
        name: 'Phase I Environmental Assessment',
        description: 'Environmental site assessment for the grocery co-op location',
        category: 'environmental',
        entityType: 'project',
        entityId: 'P001',
        entityName: 'Eastside Grocery Co-Op',
        projectId: 'P001',
        projectName: 'Eastside Grocery Co-Op',
        currentVersion: {
          id: 'v1',
          versionNumber: 3,
          fileName: 'Phase_I_ESA_v3.pdf',
          fileSize: 2456789,
          mimeType: 'application/pdf',
          uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
          uploadedAt: '2024-12-10T14:30:00Z',
          changeNotes: 'Updated soil testing results',
          checksum: 'abc123',
          storageUrl: '/documents/phase1-esa.pdf',
        },
        versionCount: 3,
        owner: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
        organizationId: 'org1',
        shares: [],
        isPublic: false,
        tags: ['Environmental', 'Intake'],
        status: 'approved',
        requiredForClosing: true,
        createdAt: '2024-11-15T09:00:00Z',
        updatedAt: '2024-12-10T14:30:00Z',
      },
      {
        id: 'pdoc2',
        name: 'QALICB Certification',
        description: 'Qualified Active Low-Income Community Business certification',
        category: 'compliance',
        entityType: 'project',
        entityId: 'P001',
        entityName: 'Eastside Grocery Co-Op',
        projectId: 'P001',
        projectName: 'Eastside Grocery Co-Op',
        currentVersion: {
          id: 'v2',
          versionNumber: 1,
          fileName: 'QALICB_Cert_Eastside.pdf',
          fileSize: 856432,
          mimeType: 'application/pdf',
          uploadedBy: { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com' },
          uploadedAt: '2024-12-08T11:15:00Z',
          checksum: 'def456',
          storageUrl: '/documents/qalicb-cert.pdf',
        },
        versionCount: 1,
        owner: { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com' },
        organizationId: 'org1',
        shares: [],
        isPublic: false,
        tags: ['QALICB', 'Compliance'],
        status: 'pending_review',
        requiredForClosing: true,
        createdAt: '2024-12-08T11:15:00Z',
        updatedAt: '2024-12-08T11:15:00Z',
      },
      {
        id: 'pdoc3',
        name: 'Financial Projections',
        description: '10-year pro forma financial model for the grocery project',
        category: 'financial',
        entityType: 'project',
        entityId: 'P001',
        entityName: 'Eastside Grocery Co-Op',
        projectId: 'P001',
        projectName: 'Eastside Grocery Co-Op',
        currentVersion: {
          id: 'v3',
          versionNumber: 5,
          fileName: 'Eastside_ProForma_v5.xlsx',
          fileSize: 1234567,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
          uploadedAt: '2024-12-11T16:20:00Z',
          changeNotes: 'Updated interest rate assumptions',
          checksum: 'ghi789',
          storageUrl: '/documents/proforma.xlsx',
        },
        versionCount: 5,
        owner: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
        organizationId: 'org1',
        shares: [],
        isPublic: false,
        tags: ['Financial Projections'],
        status: 'approved',
        requiredForClosing: false,
        createdAt: '2024-10-20T14:00:00Z',
        updatedAt: '2024-12-11T16:20:00Z',
      },
      {
        id: 'pdoc4',
        name: 'Intake Application',
        description: 'Original NMTC intake application form',
        category: 'intake',
        entityType: 'project',
        entityId: 'P001',
        entityName: 'Eastside Grocery Co-Op',
        projectId: 'P001',
        projectName: 'Eastside Grocery Co-Op',
        currentVersion: {
          id: 'v4',
          versionNumber: 2,
          fileName: 'Intake_Form_Eastside_v2.pdf',
          fileSize: 567890,
          mimeType: 'application/pdf',
          uploadedBy: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
          uploadedAt: '2024-11-20T10:00:00Z',
          changeNotes: 'Added supplemental information',
          checksum: 'jkl012',
          storageUrl: '/documents/intake.pdf',
        },
        versionCount: 2,
        owner: { id: 'u1', name: 'John Smith', email: 'john@example.com' },
        organizationId: 'org1',
        shares: [],
        isPublic: false,
        tags: ['Intake'],
        status: 'approved',
        requiredForClosing: true,
        createdAt: '2024-11-15T08:00:00Z',
        updatedAt: '2024-11-20T10:00:00Z',
      },
    ];
  }
  return [];
};

// Document checklist for NMTC closing
const closingChecklist = [
  { name: 'Intake Application', category: 'intake', tags: ['Intake'] },
  { name: 'QALICB Certification', category: 'compliance', tags: ['QALICB', 'Compliance'] },
  { name: 'Phase I Environmental', category: 'environmental', tags: ['Environmental'] },
  { name: 'Appraisal', category: 'appraisal', tags: ['Appraisal'] },
  { name: 'Financial Projections', category: 'financial', tags: ['Financial Projections'] },
  { name: 'Title Report', category: 'legal', tags: ['Title', 'Legal'] },
  { name: 'Insurance Certificate', category: 'legal', tags: ['Insurance'] },
  { name: 'CDE Agreement', category: 'legal', tags: ['CDE Agreements', 'Legal'] },
  { name: 'Term Sheet', category: 'legal', tags: ['Term Sheet', 'Legal'] },
  { name: 'Tax Opinion', category: 'legal', tags: ['Tax Opinion', 'Legal'] },
];

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const project = demoProjects[projectId];
  const [documents, setDocuments] = useState<Document[]>(getProjectDocuments(projectId));
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
  const [filterTag, setFilterTag] = useState<DocumentTag | 'all'>('all');
  const [shareDocument, setShareDocument] = useState<Document | null>(null);

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

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (filterCategory !== 'all' && doc.category !== filterCategory) return false;
    if (filterTag !== 'all' && !doc.tags.includes(filterTag)) return false;
    return true;
  });

  // Get unique tags from documents
  const availableTags = Array.from(new Set(documents.flatMap(d => d.tags)));

  // Checklist status
  const checklistStatus = closingChecklist.map(item => {
    const found = documents.find(d => 
      d.tags.some(t => item.tags.includes(t)) || d.category === item.category
    );
    return {
      ...item,
      status: found ? (found.status === 'approved' ? 'complete' : 'pending') : 'missing',
      documentId: found?.id,
    };
  });

  const completedCount = checklistStatus.filter(c => c.status === 'complete').length;
  const totalRequired = closingChecklist.length;

  const handleShare = (share: Omit<DocumentShare, 'id' | 'sharedAt' | 'sharedBy'>) => {
    if (!shareDocument) return;
    const newShare: DocumentShare = {
      ...share,
      id: `s${Date.now()}`,
      sharedAt: new Date().toISOString(),
      sharedBy: { id: 'u1', name: 'John Smith' },
    };
    setDocuments(documents.map(doc => 
      doc.id === shareDocument.id 
        ? { ...doc, shares: [...doc.shares, newShare] }
        : doc
    ));
  };

  const handleRemoveShare = (shareId: string) => {
    if (!shareDocument) return;
    setDocuments(documents.map(doc => 
      doc.id === shareDocument.id 
        ? { ...doc, shares: doc.shares.filter(s => s.id !== shareId) }
        : doc
    ));
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      setDocuments(documents.filter(d => d.id !== doc.id));
    }
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
          {project.name}
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Documents</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Project Documents</h1>
          <p className="text-gray-400 mt-1">{project.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/documents/new?entityType=project&entityId=${projectId}`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Document
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | 'all')}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
            >
              <option value="all">All Categories</option>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as DocumentTag | 'all')}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onShare={setShareDocument}
                  onDelete={handleDelete}
                  showEntity={false}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-gray-400">No documents found.</p>
                <Link
                  href={`/dashboard/documents/new?entityType=project&entityId=${projectId}`}
                  className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Add First Document
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Closing Checklist */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-semibold text-gray-200 mb-3">Closing Readiness</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(completedCount / totalRequired) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">
                {completedCount}/{totalRequired}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {totalRequired - completedCount} documents remaining
            </p>
          </div>

          {/* Checklist */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="font-semibold text-gray-200 mb-3">Document Checklist</h3>
            <div className="space-y-2">
              {checklistStatus.map((item, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    item.status === 'complete' ? 'bg-green-900/20' :
                    item.status === 'pending' ? 'bg-amber-900/20' : 'bg-gray-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    item.status === 'complete' ? 'bg-green-600 text-white' :
                    item.status === 'pending' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {item.status === 'complete' ? '✓' : item.status === 'pending' ? '!' : '○'}
                  </span>
                  <span className={`text-sm flex-1 ${
                    item.status === 'missing' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    {item.name}
                  </span>
                  {item.status === 'missing' && (
                    <Link
                      href={`/dashboard/documents/new?entityType=project&entityId=${projectId}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Add
                    </Link>
                  )}
                  {item.documentId && (
                    <Link
                      href={`/dashboard/documents/${item.documentId}`}
                      className="text-xs text-gray-500 hover:text-gray-300"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareDocument && (
        <ShareModal
          document={shareDocument}
          onClose={() => setShareDocument(null)}
          onShare={handleShare}
          onRemoveShare={handleRemoveShare}
        />
      )}
    </div>
  );
}
