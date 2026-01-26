import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

// GET - Fetch organization by ID
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // CRITICAL: Users can only access their own organization (unless admin)
    if (id !== user.organizationId && user.organizationType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Organization] Fetch error:', error);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT - Update organization
export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const {
      id,
      name,
      description,
      website,
      phone,
      address_line1,
      city,
      state,
      zip_code,
      year_founded,
      primary_contact_name,
      primary_contact_email,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // CRITICAL: Users can only update their own organization (unless admin)
    if (id !== user.organizationId && user.organizationType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (address_line1 !== undefined) updateData.address_line1 = address_line1;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (year_founded !== undefined) updateData.year_founded = year_founded;
    if (primary_contact_name !== undefined) updateData.primary_contact_name = primary_contact_name;
    if (primary_contact_email !== undefined) updateData.primary_contact_email = primary_contact_email;

    const { data, error } = await (supabase as any)
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Organization] Update error:', error);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json({ organization: data, success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
