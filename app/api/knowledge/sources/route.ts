import { NextRequest, NextResponse } from 'next/server';
import { getSources } from '@/lib/knowledge';
import { KnowledgeCategory } from '@/lib/knowledge/types';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category') as KnowledgeCategory | null;
    
    const sources = await getSources(category || undefined);
    
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Failed to get sources:', error);
    
    // Return empty array if Supabase not configured yet
    return NextResponse.json({ sources: [] });
  }
}
