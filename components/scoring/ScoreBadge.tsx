'use client';

import React from 'react';

interface ScoreBadgeProps {
  score: number;
  tier: 1 | 2 | 3;
  size?: 'sm' | 'md';
  showTier?: boolean;
}

const TIER_CONFIG = {
  1: {
    label: 'Greenlight',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700/50',
  },
  2: {
    label: 'Watchlist', 
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700/50',
  },
  3: {
    label: 'Defer',
    color: 'text-red-400', 
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700/50',
  }
};

export default function ScoreBadge({ score, tier, size = 'md', showTier = true }: ScoreBadgeProps) {
  const tierConfig = TIER_CONFIG[tier];
  const isSmall = size === 'sm';
  
  return (
    <div className={`inline-flex items-center gap-2 ${isSmall ? 'text-xs' : 'text-sm'}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${tierConfig.bgColor} ${tierConfig.borderColor} border`}>
        <span className={`font-bold ${tierConfig.color} ${isSmall ? 'text-sm' : 'text-lg'}`}>
          {score}
        </span>
        <span className="text-gray-400">/100</span>
      </div>
      {showTier && (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tierConfig.bgColor} ${tierConfig.color} ${tierConfig.borderColor} border`}>
          {tierConfig.label}
        </span>
      )}
    </div>
  );
}