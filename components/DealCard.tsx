'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Deal, STATUS_CONFIG, PROGRAM_COLORS } from '@/lib/data/deals';

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
  return `$${(amount / 1000).toFixed(0)}K`;
};

export default function DealCard({ deal, onRequestMemo, memoRequested }: DealCardProps) {
  const location = `${deal.city}, ${deal.state}`;
  const financingGap = deal.financingGap ?? deal.allocation;
  const programColor = PROGRAM_COLORS[deal.programType];
  const statusConfig = STATUS_CONFIG[deal.status];

  return (
    <div className="max-w-sm bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
      {/* Hero Image */}
      {deal.heroImageUrl && (
        <div className="relative h-40 bg-gray-800">
          <Image
            src={deal.heroImageUrl}
            alt={deal.projectName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        </div>
      )}

      {/* Header row */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${programColor.bg} ${programColor.text}`}>
              {deal.programType}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <Link href={`/deals/${deal.id}`} className="hover:text-indigo-400 transition-colors">
            <h2 className="text-lg font-bold text-gray-100 leading-snug truncate">{deal.projectName}</h2>
          </Link>
          <p className="text-sm text-gray-400">{location}</p>
        </div>
        {/* Organization Logo or tCredex fallback */}
        <div className="flex-shrink-0 ml-3">
          {deal.logoUrl ? (
            <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden">
              <Image
                src={deal.logoUrl}
                alt={deal.sponsorName || 'Organization logo'}
                fill
                className="object-contain p-1"
              />
            </div>
          ) : (
            <Image
              src="/brand/tcredex_transparent_256x64.png"
              alt="tCredex Logo"
              width={80}
              height={20}
              className="h-5 w-auto opacity-60"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-700" />

      {/* Details */}
      <div className="p-4 text-sm text-gray-300 space-y-1">
        {deal.sponsorName && <p><span className="text-gray-500">Sponsor:</span> {deal.sponsorName}</p>}
        {deal.city && <p><span className="text-gray-500">City:</span> {deal.city}</p>}
        {deal.state && <p><span className="text-gray-500">State:</span> {deal.state}</p>}
        {deal.povertyRate !== undefined && <p><span className="text-gray-500">Poverty Rate:</span> {deal.povertyRate}%</p>}
        {deal.medianIncome !== undefined && <p><span className="text-gray-500">Median Income:</span> ${deal.medianIncome.toLocaleString()}</p>}
        
        <hr className="border-gray-800 my-2" />
        
        <p><span className="text-gray-500">Allocation:</span> <span className="text-indigo-400 font-medium">{formatCurrency(deal.allocation)}</span></p>
        <p><span className="text-gray-500">Program:</span> {deal.programType} ({deal.programLevel})</p>
        
        <hr className="border-gray-800 my-2" />
        
        <p className="text-green-400 font-semibold">
          <span className="text-gray-500">Status:</span> {deal.status.replace('_', ' ')}
        </p>
        {deal.submittedDate && <p><span className="text-gray-500">Submitted:</span> {new Date(deal.submittedDate).toLocaleDateString()}</p>}
        <p><span className="text-gray-500">Financing Gap:</span> <span className="text-orange-400 font-medium">{formatCurrency(financingGap)}</span></p>
        <p><span className="text-gray-500">Deal ID:</span> <span className="font-mono text-xs">{deal.id}</span></p>
      </div>

      {/* CTA */}
      <div className="p-4 pt-0">
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
            className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Request Allocation Memo
          </button>
        )}
      </div>
    </div>
  );
}
