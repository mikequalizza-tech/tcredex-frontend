/**
 * Project Drafts API
 * 
 * GET /api/drafts?email=xxx - Load draft for email
 * POST /api/drafts - Save/update draft
 * DELETE /api/drafts?id=xxx - Delete a draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Load draft
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');

  if (!email && !id) {
    return NextResponse.json(
      { error: 'Email or draft ID required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('project_drafts')
      .select('*')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('owner_email', email.toLowerCase());
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Drafts] Load error:', error);
      return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({ 
      draft: data,
      message: 'Draft loaded successfully'
    });

  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Save/update draft
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await request.json();
    const { email, data, readinessScore } = body;

    if (!email || !data) {
      return NextResponse.json(
        { error: 'Email and data required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase();
    const projectName = data.projectName || 'Untitled Project';

    // Check if draft exists for this email
    const { data: existing } = await supabase
      .from('project_drafts')
      .select('id')
      .eq('owner_email', cleanEmail)
      .eq('status', 'draft')
      .single();

    let result;

    if (existing) {
      // Update existing draft
      result = await supabase
        .from('project_drafts')
        .update({
          data,
          project_name: projectName,
          readiness_score: readinessScore || 0,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', (existing as { id: string }).id)
        .select()
        .single();
    } else {
      // Create new draft
      result = await supabase
        .from('project_drafts')
        .insert({
          owner_email: cleanEmail,
          project_name: projectName,
          data,
          readiness_score: readinessScore || 0,
          status: 'draft'
        } as never)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[Drafts] Save error:', result.error);
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      draft: result.data,
      message: existing ? 'Draft updated' : 'Draft created'
    });

  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete draft
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');

  if (!id && !email) {
    return NextResponse.json(
      { error: 'Draft ID or email required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase.from('project_drafts').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('owner_email', email.toLowerCase()).eq('status', 'draft');
    }

    const { error } = await query;

    if (error) {
      console.error('[Drafts] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted'
    });

  } catch (error) {
    console.error('[Drafts] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
