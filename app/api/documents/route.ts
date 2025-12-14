import { NextResponse } from 'next/server';

// tCredex Documents API
// Handles document upload status and management

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get('dealId');

  if (!dealId) {
    return NextResponse.json(
      { error: 'Deal ID is required' },
      { status: 400 }
    );
  }

  // Mock document list for a deal
  const documents = [
    { id: 1, name: 'QALICB Certification Letter', status: 'uploaded', uploadedAt: '2024-01-10' },
    { id: 2, name: 'CDE LOI', status: 'uploaded', uploadedAt: '2024-01-12' },
    { id: 3, name: 'CDE Commitment Letter', status: 'pending', uploadedAt: null },
    { id: 4, name: 'Investor Offer Sheet', status: 'pending', uploadedAt: null },
    { id: 5, name: 'Sources & Uses', status: 'uploaded', uploadedAt: '2024-01-15' },
    { id: 6, name: 'Financial Statements (3 years)', status: 'pending', uploadedAt: null },
    { id: 7, name: 'Project Schedule', status: 'pending', uploadedAt: null },
    { id: 8, name: 'Environmental Phase I', status: 'pending', uploadedAt: null },
  ];

  return NextResponse.json({ dealId, documents });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dealId, documentType, fileName } = body;

    // Mock document upload response
    return NextResponse.json({
      success: true,
      document: {
        id: Date.now(),
        dealId,
        type: documentType,
        fileName,
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document upload' },
      { status: 500 }
    );
  }
}
