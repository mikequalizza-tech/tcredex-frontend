/**
 * tCredex Documents API
 * Document upload and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabase = getSupabaseAdmin();

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
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: body.uploaded_by || 'unknown',
      entity_type: 'document',
      entity_id: (data as { id: string }).id,
      action: 'document_uploaded',
      payload_json: {
        name: body.name,
        category: body.category,
        deal_id: body.deal_id,
      },
      hash: generateHash(data as Record<string, unknown>),
    } as never);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// =============================================================================
// PUT /api/documents - Upload file directly to Supabase Storage
// =============================================================================
export async function PUT(request: NextRequest) {
  try {
    // Check content type to determine if this is a file upload or JSON request
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Direct file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const dealId = formData.get('dealId') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = dealId
        ? `deals/${dealId}/${timestamp}-${safeName}`
        : `uploads/${timestamp}-${safeName}`;

      // Ensure bucket exists
      await ensureBucketExists();

      // Upload file directly
      const fileBuffer = await file.arrayBuffer();
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
          error: 'Failed to upload file',
          details: error.message
        }, { status: 500 });
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`;

      return NextResponse.json({
        success: true,
        path: data.path,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } else {
      // JSON request for signed URL (legacy support)
      const body = await request.json();
      const { fileName, contentType: fileContentType, dealId } = body;

      if (!fileName) {
        return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
      }

      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = dealId
        ? `deals/${dealId}/${timestamp}-${safeName}`
        : `uploads/${timestamp}-${safeName}`;

      await ensureBucketExists();

      // Create signed upload URL
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUploadUrl(path);

      if (error) {
        console.error('Signed URL error:', error.message, error);
        return NextResponse.json({
          error: 'Failed to create upload URL',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        uploadUrl: data.signedUrl,
        path,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`,
      });
    }
  } catch (error) {
    console.error('PUT /api/documents error:', error);
    return NextResponse.json({
      error: 'Failed to upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper to ensure the documents bucket exists
async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'documents');

  if (!bucketExists) {
    console.log('Creating documents bucket...');
    const { error: createError } = await supabase.storage.createBucket('documents', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    });

    if (createError && !createError.message.includes('already exists')) {
      console.error('Failed to create bucket:', createError);
      throw new Error(`Bucket creation failed: ${createError.message}`);
    }
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
