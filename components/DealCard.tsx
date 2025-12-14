'use client';

import Image from 'next/image';

export interface Deal {
  id: string;
  projectName: string;
  location: string;
  parent?: string;
  address?: string;
  censusTract?: string;
  povertyRate?: number;
  medianIncome?: number;
  unemployment?: number;
  projectCost: number;
  fedNmtcReq?: number;
  stateNmtcReq?: number;
  htc?: number;
  lihtc?: number;
  shovelReady?: boolean;
  completionDate?: string;
  financingGap: number;
  coordinates?: [number, number]; // [lng, lat]
  description?: string;
  impactStatement?: string;
  hasProfile?: boolean;
}

interface DealCardProps {
  deal: Deal;
  onRequestMemo?: (dealId: string) => void;
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return 'N/A';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

export default function DealCard({ deal, onRequestMemo }: DealCardProps) {
  return (
    <div className="max-w-sm bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
      {/* Header row */}
      <div className="p-4 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-gray-100 leading-snug">{deal.projectName}</h2>
          <p className="text-sm text-gray-400">{deal.location}</p>
        </div>
        <Image 
          src="/brand/tcredex_transparent_256x64.png" 
          alt="tCredex Logo" 
          width={80} 
          height={20}
          className="h-5 w-auto opacity-60"
        />
      </div>

      {/* Divider */}
      <hr className="border-gray-700" />

      {/* Details */}
      <div className="p-4 text-sm text-gray-300 space-y-1">
        {deal.parent && <p><span className="text-gray-500">Parent:</span> {deal.parent}</p>}
        {deal.address && <p><span className="text-gray-500">Address:</span> {deal.address}</p>}
        {deal.censusTract && <p><span className="text-gray-500">Census Tract:</span> {deal.censusTract}</p>}
        {deal.povertyRate !== undefined && <p><span className="text-gray-500">Poverty Rate:</span> {deal.povertyRate}%</p>}
        {deal.medianIncome !== undefined && <p><span className="text-gray-500">Median Income:</span> ${deal.medianIncome.toLocaleString()}</p>}
        {deal.unemployment !== undefined && <p><span className="text-gray-500">Unemployment:</span> {deal.unemployment}%</p>}
        
        <hr className="border-gray-800 my-2" />
        
        <p><span className="text-gray-500">Project Cost:</span> <span className="text-indigo-400 font-medium">{formatCurrency(deal.projectCost)}</span></p>
        {deal.fedNmtcReq !== undefined && <p><span className="text-gray-500">Fed NMTC Req:</span> {formatCurrency(deal.fedNmtcReq)}</p>}
        {deal.stateNmtcReq !== undefined && <p><span className="text-gray-500">State NMTC Req:</span> {formatCurrency(deal.stateNmtcReq)}</p>}
        {deal.htc !== undefined && <p><span className="text-gray-500">HTC:</span> {formatCurrency(deal.htc)}</p>}
        {deal.lihtc !== undefined && <p><span className="text-gray-500">LIHTC:</span> {formatCurrency(deal.lihtc)}</p>}
        
        <hr className="border-gray-800 my-2" />
        
        <p className={deal.shovelReady ? "text-green-400 font-semibold" : "text-yellow-400"}>
          <span className="text-gray-500">Shovel Ready:</span> {deal.shovelReady ? 'Yes ✓' : 'No'}
        </p>
        {deal.completionDate && <p><span className="text-gray-500">Completion:</span> {deal.completionDate}</p>}
        <p><span className="text-gray-500">Financing Gap:</span> <span className="text-orange-400 font-medium">{formatCurrency(deal.financingGap)}</span></p>
        <p><span className="text-gray-500">Deal ID:</span> <span className="font-mono text-xs">{deal.id}</span></p>
      </div>

      {/* CTA */}
      <div className="p-4 pt-0">
        <button 
          onClick={() => onRequestMemo?.(deal.id)}
          className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Request Allocation Memo
        </button>
      </div>
    </div>
  );
}
