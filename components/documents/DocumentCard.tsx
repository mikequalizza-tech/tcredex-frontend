'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Document, DOCUMENT_CATEGORIES, formatFileSize } from '@/lib/documents/types';

interface DocumentCardProps {
  document: Document;
  onShare?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  showEntity?: boolean;
}

export default function DocumentCard({ 
  document, 
  onShare, 
  onDelete,
  showEntity = true 
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const category = DOCUMENT_CATEGORIES[document.category];
  
  const getFileIcon = () => {
    const ext = document.currentVersion.fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📁';
    }
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors group">
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          {getFileIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link 
                href={`/dashboard/documents/${document.id}`}
                className="text-gray-100 font-medium hover:text-indigo-400 transition-colors truncate block"
              >
                {document.name}
              </Link>
              <p className="text-xs text-gray-500 truncate">
                {document.currentVersion.fileName}
              </p>
            </div>

            {/* Actions Menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                  <Link
                    href={`/dashboard/documents/${document.id}`}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => { onShare?.(document); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    Share
                  </button>
                  <a
                    href={document.currentVersion.storageUrl}
                    download
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => { onDelete?.(document); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor()}`}>
              {document.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs bg-${category.color}-900/30 text-${category.color}-300`}>
              {category.label}
            </span>
            {document.requiredForClosing && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-300 border border-red-500/30">
                Required
              </span>
            )}
          </div>

          {/* Footer info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{formatFileSize(document.currentVersion.fileSize)}</span>
            <span>v{document.currentVersion.versionNumber}</span>
            <span>{formatDate(document.updatedAt)}</span>
            {document.shares.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {document.shares.length} shared
              </span>
            )}
          </div>

          {/* Entity association */}
          {showEntity && (
            <p className="text-xs text-gray-600 mt-2">
              {document.entityType}: {document.entityName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
