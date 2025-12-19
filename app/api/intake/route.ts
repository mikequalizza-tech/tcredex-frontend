import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface IntakeFormData {
  projectName: string;
  sponsorName: string;
  address: string;
  censusTract: string;
  totalCost: string;
  requestedNMTC: string;
  requestedHTC: string;
  requestedLIHTC: string;
  shovelReady: boolean;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: IntakeFormData = await req.json();

    // Validate required fields
    if (!body.projectName || !body.sponsorName || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, sponsorName, email' },
        { status: 400 }
      );
    }

    // Generate a deal ID
    const dealId = `D${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Parse numeric values
    const totalCost = body.totalCost ? parseFloat(body.totalCost.replace(/[^0-9.]/g, '')) : null;
    const requestedNMTC = body.requestedNMTC ? parseFloat(body.requestedNMTC.replace(/[^0-9.]/g, '')) : null;
    const requestedHTC = body.requestedHTC ? parseFloat(body.requestedHTC.replace(/[^0-9.]/g, '')) : null;
    const requestedLIHTC = body.requestedLIHTC ? parseFloat(body.requestedLIHTC.replace(/[^0-9.]/g, '')) : null;

    // Save to Supabase projects table
    const { data, error } = await supabase
      .from('projects')
      .insert({
        deal_id: dealId,
        project_name: body.projectName,
        sponsor_name: body.sponsorName,
        email: body.email,
        address: body.address || null,
        census_tract: body.censusTract || null,
        total_cost: totalCost,
        requested_nmtc: requestedNMTC,
        requested_htc: requestedHTC,
        requested_lihtc: requestedLIHTC,
        shovel_ready: body.shovelReady || false,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('[Intake] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save project', details: error.message },
        { status: 500 }
      );
    }

    // =========================================================================
    // LEDGER: Log to tamper-evident audit trail
    // =========================================================================
    try {
      // Get the last ledger event hash for chain continuity
      const { data: lastEvent } = await supabase
        .from('ledger_events')
        .select('id, hash')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      const prevHash = lastEvent?.hash || null;
      const prevId = lastEvent?.id || 0;

      // Build the payload snapshot (what we're recording)
      const payload = {
        deal_id: dealId,
        project_name: body.projectName,
        sponsor_name: body.sponsorName,
        email: body.email,
        address: body.address || null,
        census_tract: body.censusTract || null,
        total_cost: totalCost,
        requested_nmtc: requestedNMTC,
        requested_htc: requestedHTC,
        requested_lihtc: requestedLIHTC,
        shovel_ready: body.shovelReady || false,
        submitted_at: timestamp
      };

      // Compute hash for this event
      const canonicalString = buildCanonicalString(
        prevId + 1,
        timestamp,
        'human',
        body.email,
        'application',
        dealId,
        'application_submitted',
        payload,
        null,
        null,
        prevHash
      );
      const eventHash = computeHash(canonicalString);

      // Insert ledger event
      await supabase.from('ledger_events').insert({
        event_timestamp: timestamp,
        actor_type: 'human',
        actor_id: body.email,
        entity_type: 'application',
        entity_id: dealId,
        action: 'application_submitted',
        payload_json: payload,
        model_version: null,
        reason_codes: null,
        prev_hash: prevHash,
        hash: eventHash
      });

      console.log(`[Ledger] ✓ Deal ${dealId} logged to audit trail`);

    } catch (ledgerError) {
      // Don't fail the intake on ledger error - log and continue
      console.error('[Ledger] Warning - failed to log event:', ledgerError);
    }

    console.log('[Intake] ✓ Deal submitted:', dealId);

    return NextResponse.json({
      success: true,
      dealId,
      message: 'Project intake submitted successfully',
      data,
    });
  } catch (error) {
    console.error('[Intake] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake form' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Intake API - Use POST to submit a new project',
    requiredFields: ['projectName', 'sponsorName', 'email'],
    optionalFields: ['address', 'censusTract', 'totalCost', 'requestedNMTC', 'requestedHTC', 'requestedLIHTC', 'shovelReady'],
  });
}

// =============================================================================
// Hash Chain Utilities (inline for this route)
// =============================================================================

function buildCanonicalString(
  eventId: number | string,
  timestamp: string,
  actorType: string,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  payloadJson: Record<string, unknown>,
  modelVersion: string | null | undefined,
  reasonCodes: Record<string, unknown> | null | undefined,
  prevHash: string | null | undefined
): string {
  const canonicalPayload = JSON.stringify(payloadJson, Object.keys(payloadJson).sort());
  const canonicalReasonCodes = reasonCodes 
    ? JSON.stringify(reasonCodes, Object.keys(reasonCodes).sort()) 
    : '';
  
  const parts = [
    String(eventId),
    timestamp,
    actorType,
    actorId,
    entityType,
    entityId,
    action,
    canonicalPayload,
    modelVersion || '',
    canonicalReasonCodes,
    prevHash || ''
  ];
  
  return parts.join('|');
}

function computeHash(canonicalString: string): string {
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}
