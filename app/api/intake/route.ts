import { NextRequest, NextResponse } from 'next/server';

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

    // TODO: In production, save to database
    console.log('[Intake Form] New submission:', body);

    // Generate a deal ID
    const dealId = `D${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      dealId,
      message: 'Project intake submitted successfully',
      data: body,
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
