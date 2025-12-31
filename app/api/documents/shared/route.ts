/**
 * tCredex Documents API - Shared Documents
 * GET /api/documents/shared - List documents shared with the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('user_id');
    const category = searchParams.get('category');

    // Fetch documents with their shares
    let query = supabase
      .from('documents')
      .select(`
        *,
        deal:deals(id, project_name),
        organization:organizations(id, name)
      `)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching shared documents:', error);
      return NextResponse.json({ documents: [], total: 0 });
    }

    // Map to expected format
    const sharedDocs = (documents || []).map((doc: any) => ({
      id: doc.id,
      name: doc.name || 'Untitled Document',
      description: doc.description || '',
      category: doc.category || 'other',
      entityType: doc.deal_id ? 'deal' : 'organization',
      entityId: doc.deal_id || doc.organization_id || '',
      entityName: doc.deal?.project_name || doc.organization?.name || 'Unknown',
      projectId: doc.deal_id,
      projectName: doc.deal?.project_name,
      dealId: doc.deal_id,
      dealName: doc.deal?.project_name,
      currentVersion: {
        id: doc.id,
        versionNumber: doc.version || 1,
        fileName: doc.name,
        fileSize: doc.file_size || 0,
        mimeType: doc.mime_type || 'application/octet-stream',
        uploadedBy: {
          id: doc.uploaded_by || '',
          name: doc.uploaded_by_name || 'Unknown',
          email: doc.uploaded_by_email || '',
        },
        uploadedAt: doc.created_at,
        checksum: '',
        storageUrl: doc.file_url || '',
      },
      versionCount: doc.version || 1,
      owner: {
        id: doc.uploaded_by || '',
        name: doc.uploaded_by_name || 'Unknown',
        email: doc.uploaded_by_email || '',
      },
      organizationId: doc.organization_id || '',
      shares: [],
      isPublic: doc.is_public || false,
      lock: null,
      collaborators: [],
      tags: doc.tags || [],
      status: doc.status || 'pending_review',
      requiredForClosing: doc.required_for_closing || false,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at || doc.created_at,
    }));

    return NextResponse.json({
      documents: sharedDocs,
      total: sharedDocs.length,
    });
  } catch (error) {
    console.error('Shared documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', documents: [] },
      { status: 500 }
    );
  }
}
