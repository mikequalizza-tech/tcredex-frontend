'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Deal } from '@/lib/data/deals';

interface DealCardProps {
  deal: Deal;
  onRequestMemo?: (dealId: string) => void;
  memoRequested?: boolean;
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return 'N/A';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

const formatDate = (date: string | undefined) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
};

// Extract deal ID for display (last 5 chars or full if short)
const getDealIdDisplay = (id: string) => {
  if (id.length <= 6) return id;
  return `D${id.slice(-5)}`;
};

export default function DealCard({ deal, onRequestMemo, memoRequested }: DealCardProps) {
  const location = `${deal.city || ''}, ${deal.state || ''}`.trim();
  const financingGap = deal.financingGap ?? 0;
  const projectCost = deal.projectCost ?? 0;
  
  // Determine NMTC amounts - use explicit fields if available, otherwise estimate
  const fedNMTC = deal.programType === 'NMTC' && deal.programLevel === 'federal' 
    ? deal.allocation 
    : deal.programType === 'NMTC' && deal.programLevel !== 'state'
    ? deal.allocation 
    : 0;
  
  const stateNMTC = deal.stateNMTCAllocation || 
    (deal.programType === 'NMTC' && deal.programLevel === 'state' ? deal.allocation : 0);
  
  // HTC amount - use explicit field if available, otherwise check if HTC program
  const htcAmount = deal.htcAmount || (deal.programType === 'HTC' ? deal.allocation : 0);
  
  // Shovel ready status
  const shovelReady = deal.shovelReady ?? false;
  
  // Completion date
  const completionDate = deal.completionDate || deal.timeline?.find(t => t.milestone.includes('Completion'))?.date;

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3 relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-xl font-bold text-white leading-tight mb-1">{deal.projectName}</h2>
            <p className="text-sm text-gray-400">{location}</p>
          </div>
          {/* Logo/Icon in top right */}
          <div className="flex-shrink-0">
            {deal.logoUrl ? (
              <div className="relative w-10 h-10 bg-white rounded overflow-hidden">
                <Image
                  src={deal.logoUrl}
                  alt={deal.sponsorName || 'Logo'}
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-indigo-900/30 rounded flex items-center justify-center">
                <span className="text-indigo-400 text-xs font-bold">TC</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Details Section */}
      <div className="px-4 pb-3 space-y-1.5 text-sm">
        <div className="flex">
          <span className="text-gray-500 w-24 flex-shrink-0">Parent:</span>
          <span className="text-gray-300">{deal.sponsorName || 'N/A'}</span>
        </div>
        {deal.address && (
          <div className="flex">
            <span className="text-gray-500 w-24 flex-shrink-0">Address:</span>
            <span className="text-gray-300">{deal.address}</span>
          </div>
        )}
        {deal.censusTract && (
          <div className="flex">
            <span className="text-gray-500 w-24 flex-shrink-0">Census Tract:</span>
            <span className="text-gray-300 font-mono text-xs">{deal.censusTract}</span>
          </div>
        )}
        {deal.povertyRate !== undefined && (
          <div className="flex">
            <span className="text-gray-500 w-24 flex-shrink-0">Poverty Rate:</span>
            <span className="text-gray-300">{deal.povertyRate.toFixed(0)}%</span>
          </div>
        )}
        {deal.medianIncome !== undefined && (
          <div className="flex">
            <span className="text-gray-500 w-24 flex-shrink-0">Median Income:</span>
            <span className="text-gray-300">${deal.medianIncome.toLocaleString()}</span>
          </div>
        )}
        {deal.unemployment !== undefined && (
          <div className="flex">
            <span className="text-gray-500 w-24 flex-shrink-0">Unemployment:</span>
            <span className="text-gray-300">{deal.unemployment.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Financial Details Section */}
      <div className="px-4 pb-3 space-y-1.5 text-sm border-t border-gray-800 pt-3">
        {projectCost > 0 && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">Project Cost:</span>
            <span className="text-sky-400 font-medium">{formatCurrency(projectCost)}</span>
          </div>
        )}
        {fedNMTC > 0 && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">Fed NMTC Req:</span>
            <span className="text-gray-300">{formatCurrency(fedNMTC)}</span>
          </div>
        )}
        {stateNMTC > 0 && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">State NMTC Req:</span>
            <span className="text-gray-300">{formatCurrency(stateNMTC)}</span>
          </div>
        )}
        {htcAmount > 0 && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">HTC:</span>
            <span className="text-gray-300">{formatCurrency(htcAmount)}</span>
          </div>
        )}
      </div>

      {/* Status and Milestones Section */}
      <div className="px-4 pb-3 space-y-1.5 text-sm border-t border-gray-800 pt-3">
        <div className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Shovel Ready:</span>
          <span className={shovelReady ? 'text-green-400' : 'text-amber-400'}>
            {shovelReady ? 'Yes ✓' : 'No'}
          </span>
        </div>
        {completionDate && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">Completion:</span>
            <span className="text-gray-300">{formatDate(completionDate)}</span>
          </div>
        )}
        {financingGap > 0 && (
          <div className="flex">
            <span className="text-gray-500 w-32 flex-shrink-0">Financing Gap:</span>
            <span className="text-orange-400 font-medium">{formatCurrency(financingGap)}</span>
          </div>
        )}
        <div className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Deal ID:</span>
          <span className="text-gray-300 font-mono text-xs">{getDealIdDisplay(deal.id)}</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-800">
        {memoRequested ? (
          <button 
            disabled
            className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg cursor-default"
          >
            ✓ Memo Requested
          </button>
        ) : (
          <button 
            onClick={() => onRequestMemo?.(deal.id)}
            className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Request Allocation Memo
          </button>
        )}
      </div>
    </div>
  );
}
