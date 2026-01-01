/**
 * tCredex API - Register
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName, role } = await request.json();

    if (!email || !password || !name || !organizationName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['sponsor', 'cde', 'investor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be sponsor, cde, or investor' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create or find organization
    let organization;
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .ilike('name', organizationName)
      .single();

    type OrgData = { id: string; name: string; type: string };
    const typedExistingOrg = existingOrg as OrgData | null;

    if (typedExistingOrg) {
      organization = typedExistingOrg;
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          type: role === 'cde' ? 'CDE' : role === 'investor' ? 'Investor' : 'Sponsor',
        } as never)
        .select()
        .single();

      if (orgError) {
        console.error('Org creation error:', orgError);
        // Continue without org - profile will be created without org link
      } else {
        organization = newOrg as OrgData | null;
      }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: name,
        email: email,
        role: role,
        organization_id: organization?.id || null,
      } as never);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json({
      token: authData.session?.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: role,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          type: organization.type,
        } : null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
