/**
 * tCredex Documents API
 * Document upload and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET /api/documents - List documents with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const dealId = searchParams.get('deal_id');
    const organizationId = searchParams.get('organization_id');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (dealId) query = query.eq('deal_id', dealId);
    if (organizationId) query = query.eq('organization_id', organizationId);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ documents: data });
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/documents - Create document record
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.file_url) {
      return NextResponse.json(
        { error: 'name and file_url are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: body.organization_id,
        deal_id: body.deal_id,
        closing_room_id: body.closing_room_id,
        uploaded_by: body.uploaded_by,
        name: body.name,
        file_url: body.file_url,
        file_size: body.file_size,
        mime_type: body.mime_type,
        category: body.category,
        tags: body.tags || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: body.uploaded_by || 'unknown',
      entity_type: 'document',
      entity_id: data.id,
      action: 'document_uploaded',
      payload_json: {
        name: body.name,
        category: body.category,
        deal_id: body.deal_id,
      },
      hash: generateHash(data),
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// =============================================================================
// POST /api/documents/upload-url - Get signed upload URL
// =============================================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType, dealId } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Generate unique path
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = dealId 
      ? `deals/${dealId}/${timestamp}-${safeName}`
      : `uploads/${timestamp}-${safeName}`;

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(path);

    if (error) throw error;

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`,
    });
  } catch (error) {
    console.error('PUT /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}

function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
