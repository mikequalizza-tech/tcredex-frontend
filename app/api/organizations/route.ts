/**
 * tCredex Organizations API
 * CRITICAL: Requires authentication and org membership
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, requireOrgAdmin, handleAuthError, verifyOrgAccess } from '@/lib/api/auth-middleware';

// =============================================================================
// GET /api/organizations - List user's organization(s)
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Get specific organization
    if (id) {
      // CRITICAL: Verify user belongs to this org
      verifyOrgAccess(user, id);

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      return NextResponse.json({ organization: data });
    }

    // List user's organization only
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/organizations - Create organization (admin only)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require system admin
    const user = await requireAuth(request);
    
    if (user.organizationType !== 'admin') {
      return NextResponse.json(
        { error: 'Only system admins can create organizations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // Validate org type
    const validTypes = ['sponsor', 'cde', 'investor', 'admin'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid organization type' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        slug,
        type: body.type,
        logo_url: body.logo_url,
        website: body.website,
        phone: body.phone,
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'organization',
      entity_id: (data as { id: string }).id,
      action: 'organization_created',
      payload_json: { name: body.name, type: body.type },
      hash: generateHash(data as Record<string, unknown>),
    } as never);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
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
