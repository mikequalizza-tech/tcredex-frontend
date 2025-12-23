/**
 * tCredex User API - Single User Operations
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
// GET /api/users/[id]
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/users/[id]
// =============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      id: _id, 
      created_at, 
      updated_at,
      organization,
      ...updateData 
    } = body;
    
    // If email is being updated, check it's not taken
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .single();
      
      if (existing) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/users/[id] - Soft delete
// =============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
