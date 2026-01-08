import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/organization/[id] - Get organization profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin()
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch organization:', error)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('GET /api/organization/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/organization/[id] - Update organization profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const supabase = getSupabaseAdmin()
    
    // Update organization with provided data
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        website: body.website,
        phone: body.phone,
        email: body.email,
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        entity_type: body.entity_type,
        years_in_business: body.years_in_business,
        duns_number: body.duns_number,
        ein: body.ein,
        mbe_certified: body.mbe_certified,
        wbe_certified: body.wbe_certified,
        dbe_certified: body.dbe_certified,
        geographic_focus: body.geographic_focus,
        project_types: body.project_types,
        typical_deal_size_min: body.typical_deal_size_min,
        typical_deal_size_max: body.typical_deal_size_max,
        development_experience: body.development_experience,
        completed_projects: body.completed_projects,
        allocation_amount: body.allocation_amount,
        focus_areas: body.focus_areas,
        investment_capacity: body.investment_capacity,
        preferred_programs: body.preferred_programs,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update organization:', error)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('PUT /api/organization/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}