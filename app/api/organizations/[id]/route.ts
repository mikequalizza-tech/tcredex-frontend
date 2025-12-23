/**
 * tCredex Organization API - Single Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/organizations/[id]
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('GET /api/organizations/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/organizations/[id]
// =============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      id: _id, 
      created_at, 
      updated_at,
      ...updateData 
    } = body;
    
    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('PUT /api/organizations/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
