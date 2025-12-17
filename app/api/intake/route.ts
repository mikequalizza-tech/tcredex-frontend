import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Save to Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert({
        deal_id: dealId,
        project_name: body.projectName,
        sponsor_name: body.sponsorName,
        email: body.email,
        address: body.address || null,
        census_tract: body.censusTract || null,
        total_cost: body.totalCost ? parseFloat(body.totalCost.replace(/[^0-9.]/g, '')) : null,
        requested_nmtc: body.requestedNMTC ? parseFloat(body.requestedNMTC.replace(/[^0-9.]/g, '')) : null,
        requested_htc: body.requestedHTC ? parseFloat(body.requestedHTC.replace(/[^0-9.]/g, '')) : null,
        requested_lihtc: body.requestedLIHTC ? parseFloat(body.requestedLIHTC.replace(/[^0-9.]/g, '')) : null,
        shovel_ready: body.shovelReady || false,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('[Intake Form] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save project', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Intake Form] Saved:', data);

    return NextResponse.json({
      success: true,
      dealId,
      message: 'Project intake submitted successfully',
      data,
    });
  } catch (error) {
    console.error('[Intake Form] Error:', error);
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
