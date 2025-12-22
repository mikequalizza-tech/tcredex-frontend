'use client';

import { DealScore, ScoreTier, TIER_LABELS, TIER_DESCRIPTIONS } from '@/types/scoring';

// =============================================================================
// SECTION C SCORE DISPLAY COMPONENT
// =============================================================================

interface SectionCScoreProps {
  score: DealScore;
  showBreakdown?: boolean;
  showExplanation?: boolean;
  compact?: boolean;
}

export default function SectionCScore({ 
  score, 
  showBreakdown = true,
  showExplanation = false,
  compact = false 
}: SectionCScoreProps) {
  
  const tierConfig: Record<ScoreTier, { color: string; bg: string; border: string }> = {
    TIER_1_GREENLIGHT: {
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-500',
    },
    TIER_2_WATCHLIST: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-500',
    },
    TIER_3_DEFER: {
      color: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-500',
    },
  };

  const config = tierConfig[score.tier];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} border ${config.border}`}>
        <span className={`text-2xl font-bold ${config.color}`}>{score.total_score}</span>
        <span className={`text-sm font-medium ${config.color}`}>
          {TIER_LABELS[score.tier]}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${config.border} ${config.bg} p-6 space-y-4`}>
      {/* Header with total score */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Section C Score</h3>
        <div className={`text-5xl font-bold ${config.color}`}>{score.total_score}</div>
        <p className="text-sm text-gray-500 mt-1">100 = maximum</p>
        
        {/* Tier Badge */}
        <div className="mt-4">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${config.bg} border ${config.border} ${config.color}`}>
            {TIER_LABELS[score.tier]}
          </span>
          <p className="text-xs text-gray-500 mt-2">{TIER_DESCRIPTIONS[score.tier]}</p>
        </div>
      </div>

      {/* Pillar Breakdown */}
      {showBreakdown && (
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <PillarBar 
            label="Economic Distress" 
            score={score.distress.total} 
            max={40} 
            percentile={score.distress.percentile}
          />
          <PillarBar 
            label="Impact Potential" 
            score={score.impact.total} 
            max={35} 
            percentile={score.impact.percentile}
          />
          <PillarBar 
            label="Project Readiness" 
            score={score.readiness.total} 
            max={15} 
            percentile={score.readiness.percentile}
          />
          <PillarBar 
            label="Mission Fit" 
            score={score.mission_fit.total} 
            max={10} 
            percentile={score.mission_fit.percentile}
          />
        </div>
      )}

      {/* Eligibility Flags */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Eligibility Flags</h4>
        <div className="flex flex-wrap gap-2">
          {score.eligibility_flags.nmtc_eligible && (
            <Flag label="NMTC Eligible" positive />
          )}
          {score.eligibility_flags.severely_distressed && (
            <Flag label="Severely Distressed" positive />
          )}
          {score.eligibility_flags.qct && (
            <Flag label="QCT" positive />
          )}
          {score.eligibility_flags.opportunity_zone && (
            <Flag label="Opportunity Zone" positive />
          )}
          {score.eligibility_flags.persistent_poverty_county && (
            <Flag label="PPC" positive />
          )}
          {score.eligibility_flags.non_metro && (
            <Flag label="Non-Metro" positive />
          )}
        </div>
      </div>

      {/* Reason Codes */}
      {score.reason_codes.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Score Factors</h4>
          <div className="flex flex-wrap gap-1">
            {score.reason_codes.slice(0, 6).map((code) => (
              <span 
                key={code}
                className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded"
              >
                {formatReasonCode(code)}
              </span>
            ))}
            {score.reason_codes.length > 6 && (
              <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">
                +{score.reason_codes.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Full Explanation (optional) */}
      {showExplanation && score.score_explanation && (
        <div className="pt-4 border-t border-gray-700">
          <details className="group">
            <summary className="text-sm font-semibold text-gray-400 cursor-pointer hover:text-gray-300">
              Full Score Breakdown ▾
            </summary>
            <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-400 overflow-x-auto">
              {score.score_explanation}
            </pre>
          </details>
        </div>
      )}

      {/* Metadata */}
      <div className="pt-4 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Model: v{score.model_version}</span>
          <span>Computed: {new Date(score.computed_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PILLAR BAR COMPONENT
// =============================================================================

interface PillarBarProps {
  label: string;
  score: number;
  max: number;
  percentile: number;
}

function PillarBar({ label, score, max, percentile }: PillarBarProps) {
  const widthPct = (score / max) * 100;
  
  // Color based on percentile
  const barColor = 
    percentile >= 70 ? 'bg-green-500' :
    percentile >= 50 ? 'bg-yellow-500' :
    percentile >= 30 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// FLAG BADGE COMPONENT
// =============================================================================

interface FlagProps {
  label: string;
  positive?: boolean;
}

function Flag({ label, positive = true }: FlagProps) {
  return (
    <span className={`
      px-2 py-0.5 text-xs rounded-full
      ${positive 
        ? 'bg-green-900/50 text-green-400 border border-green-700' 
        : 'bg-gray-800 text-gray-400 border border-gray-700'
      }
    `}>
      {positive && '✓ '}{label}
    </span>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatReasonCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Nmtc/g, 'NMTC')
    .replace(/Htc/g, 'HTC')
    .replace(/Lihtc/g, 'LIHTC')
    .replace(/Lmi/g, 'LMI')
    .replace(/Mfi/g, 'MFI')
    .replace(/Ppc/g, 'PPC')
    .replace(/Qct/g, 'QCT');
}

// =============================================================================
// COMPACT TIER BADGE (for lists)
// =============================================================================

interface TierBadgeProps {
  tier: ScoreTier;
  score?: number;
}

export function TierBadge({ tier, score }: TierBadgeProps) {
  const config: Record<ScoreTier, { color: string; bg: string }> = {
    TIER_1_GREENLIGHT: { color: 'text-green-400', bg: 'bg-green-900/50' },
    TIER_2_WATCHLIST: { color: 'text-yellow-400', bg: 'bg-yellow-900/50' },
    TIER_3_DEFER: { color: 'text-red-400', bg: 'bg-red-900/50' },
  };

  const { color, bg } = config[tier];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${color}`}>
      {score !== undefined && <span className="font-bold">{score}</span>}
      <span>{TIER_LABELS[tier]}</span>
    </span>
  );
}

// =============================================================================
// MINI SCORE INDICATOR (for cards)
// =============================================================================

interface MiniScoreProps {
  score: number;
  tier: ScoreTier;
}

export function MiniScore({ score, tier }: MiniScoreProps) {
  const config: Record<ScoreTier, string> = {
    TIER_1_GREENLIGHT: 'text-green-400',
    TIER_2_WATCHLIST: 'text-yellow-400',
    TIER_3_DEFER: 'text-red-400',
  };

  return (
    <div className={`text-center ${config[tier]}`}>
      <div className="text-2xl font-bold">{score}</div>
      <div className="text-xs opacity-75">Score</div>
    </div>
  );
}
