import { NextRequest, NextResponse } from 'next/server';
import { listDocuments } from '@/lib/knowledge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as any;
    
    const documents = await listDocuments(category || undefined);
    
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list documents' },
      { status: 500 }
    );
  }
}
