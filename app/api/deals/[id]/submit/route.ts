/**
 * tCredex Deal Submit API
 * 
 * POST /api/deals/[id]/submit - Submit deal for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateReadiness } from '@/lib/intake/readinessScore';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get current deal
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    // Check status - can only submit drafts
    if (deal.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot submit deal in status: ${deal.status}` },
        { status: 400 }
      );
    }
    
    // Check exclusivity agreement
    if (!deal.exclusivity_agreed && !body.exclusivity_agreed) {
      return NextResponse.json(
        { error: 'Exclusivity agreement required' },
        { status: 400 }
      );
    }
    
    // Calculate readiness score from intake_data
    const intakeData = deal.intake_data || {};
    const readinessResult = calculateReadiness(intakeData);
    
    // Determine tier from score
    let tier = 1;
    if (readinessResult.totalScore >= 70) tier = 2;
    if (readinessResult.totalScore >= 90) tier = 3;
    
    // Update deal
    const updateData = {
      status: 'submitted',
      visible: true,
      readiness_score: readinessResult.totalScore,
      tier,
      submitted_at: new Date().toISOString(),
      exclusivity_agreed: true,
      exclusivity_agreed_at: new Date().toISOString(),
    };
    
    const { data: updatedDeal, error: updateError } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: body.submitted_by || 'system',
      entity_type: 'deal',
      entity_id: id,
      action: 'application_submitted',
      payload_json: {
        readiness_score: readinessResult.totalScore,
        tier,
        programs: deal.programs,
      },
      hash: generateHash(updateData),
    });
    
    return NextResponse.json({
      deal: updatedDeal,
      readiness: readinessResult,
    });
    
  } catch (error) {
    console.error('POST /api/deals/[id]/submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit deal' },
      { status: 500 }
    );
  }
}

function generateHash(data: unknown): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
