/**
 * tCredex Section C Scoring API
 * 
 * POST /api/scoring - Score a single deal
 * POST /api/scoring/batch - Score multiple deals
 * 
 * Canonical Source: docs/chatgpt-generated/SECTION_C_SCORING_ENGINE_FRAMEWORK.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  calculateDealScore, 
  calculateBatchScores,
  MODEL_VERSION 
} from '@/lib/scoring/sectionC';
import { 
  ScoringInput, 
  ScoreRequest, 
  ScoreResponse,
  DealScore 
} from '@/types/scoring';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// VALIDATION
// =============================================================================

function validateScoringInput(input: unknown): input is ScoringInput {
  if (!input || typeof input !== 'object') return false;
  
  const i = input as Record<string, unknown>;
  
  // Required fields
  if (typeof i.deal_id !== 'string') return false;
  if (!i.tract || typeof i.tract !== 'object') return false;
  if (!i.project || typeof i.project !== 'object') return false;
  if (!i.readiness || typeof i.readiness !== 'object') return false;
  
  // Tract required fields
  const tract = i.tract as Record<string, unknown>;
  if (typeof tract.geoid !== 'string') return false;
  if (typeof tract.poverty_rate !== 'number') return false;
  if (typeof tract.median_family_income !== 'number') return false;
  if (typeof tract.unemployment_rate !== 'number') return false;
  
  return true;
}

// =============================================================================
// LEDGER LOGGING
// =============================================================================

async function logScoreToLedger(score: DealScore, actorId: string): Promise<void> {
  try {
    // Get previous hash for chain
    const { data: lastEvent } = await supabase
      .from('ledger_events')
      .select('hash')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const prevHash = lastEvent?.hash || null;

    // Create canonical payload
    const payload = {
      deal_id: score.deal_id,
      total_score: score.total_score,
      tier: score.tier,
      distress_score: score.distress.total,
      impact_score: score.impact.total,
      readiness_score: score.readiness.total,
      mission_fit_score: score.mission_fit.total,
      eligibility_flags: score.eligibility_flags,
      reason_codes: score.reason_codes,
    };

    // Simple hash (in production, use proper crypto)
    const hashInput = JSON.stringify({ prevHash, payload, timestamp: score.computed_at });
    const hash = Buffer.from(hashInput).toString('base64').slice(0, 64);

    await supabase.from('ledger_events').insert({
      actor_type: 'system',
      actor_id: actorId,
      entity_type: 'application',
      entity_id: score.deal_id,
      action: 'distress_score_calculated',
      payload_json: payload,
      model_version: score.model_version,
      reason_codes: score.reason_codes,
      prev_hash: prevHash,
      hash,
    });
  } catch (error) {
    console.error('Failed to log score to ledger:', error);
    // Don't throw - ledger failure shouldn't block scoring
  }
}

// =============================================================================
// SAVE SCORE TO DATABASE
// =============================================================================

async function saveScoreToDatabase(score: DealScore): Promise<void> {
  try {
    await supabase.from('deal_scores').upsert({
      deal_id: score.deal_id,
      total_score: score.total_score,
      tier: score.tier,
      distress_total: score.distress.total,
      distress_breakdown: score.distress.breakdown,
      distress_percentile: score.distress.percentile,
      impact_total: score.impact.total,
      impact_breakdown: score.impact.breakdown,
      impact_percentile: score.impact.percentile,
      readiness_total: score.readiness.total,
      readiness_breakdown: score.readiness.breakdown,
      readiness_percentile: score.readiness.percentile,
      mission_fit_total: score.mission_fit.total,
      mission_fit_breakdown: score.mission_fit.breakdown,
      mission_fit_cde_id: score.mission_fit.cde_id,
      eligibility_flags: score.eligibility_flags,
      reason_codes: score.reason_codes,
      score_explanation: score.score_explanation,
      model_version: score.model_version,
      input_snapshot: score.input_snapshot,
      computed_at: score.computed_at,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'deal_id',
    });
  } catch (error) {
    console.error('Failed to save score to database:', error);
    throw error;
  }
}

// =============================================================================
// POST /api/scoring - Score a single deal
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle batch request
    if (body.deals && Array.isArray(body.deals)) {
      return handleBatchScore(body.deals, body.cde_criteria);
    }
    
    // Single deal request
    const { input, cde_criteria } = body as ScoreRequest & { cde_criteria?: unknown };
    
    if (!validateScoringInput(input)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scoring input' },
        { status: 400 }
      );
    }

    // Calculate score
    const score = calculateDealScore(input, cde_criteria as any);

    // Save to database
    await saveScoreToDatabase(score);

    // Log to ledger
    await logScoreToLedger(score, 'scoring-api');

    const response: ScoreResponse = {
      success: true,
      score,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// BATCH SCORING HANDLER
// =============================================================================

async function handleBatchScore(
  deals: unknown[],
  cdeCriteria?: unknown
): Promise<NextResponse> {
  const validInputs: ScoringInput[] = [];
  const errors: { deal_id: string; error: string }[] = [];

  // Validate all inputs
  for (const deal of deals) {
    if (validateScoringInput(deal)) {
      validInputs.push(deal);
    } else {
      errors.push({
        deal_id: (deal as any)?.deal_id || 'unknown',
        error: 'Invalid input',
      });
    }
  }

  // Calculate scores
  const scores = calculateBatchScores(validInputs, cdeCriteria as any);

  // Save all scores
  for (const score of scores) {
    try {
      await saveScoreToDatabase(score);
      await logScoreToLedger(score, 'scoring-api-batch');
    } catch (error) {
      errors.push({
        deal_id: score.deal_id,
        error: 'Failed to save',
      });
    }
  }

  return NextResponse.json({
    success: true,
    scores,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// =============================================================================
// GET /api/scoring?deal_id=xxx - Retrieve existing score
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: 'deal_id required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('deal_scores')
      .select('*')
      .eq('deal_id', dealId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Score not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      score: data,
    });
  } catch (error) {
    console.error('Score retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve score' },
      { status: 500 }
    );
  }
}
