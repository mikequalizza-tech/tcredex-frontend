import { NextResponse } from 'next/server';

// tCredex Compliance API - Debarment Check
// Checks entities against SAM.gov exclusion list

export async function POST(req: Request) {
  try {
    const { entityName, ein } = await req.json();

    if (!entityName) {
      return NextResponse.json(
        { error: 'Entity name is required' },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual SAM.gov API
    // For now, return mock response
    const mockResult = {
      entityName,
      ein: ein || null,
      checked: true,
      debarred: false,
      checkedAt: new Date().toISOString(),
      source: 'SAM.gov (mock)',
      message: 'Entity is not on the exclusion list',
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Debarment check error:', error);
    return NextResponse.json(
      { error: 'Failed to perform debarment check' },
      { status: 500 }
    );
  }
}
