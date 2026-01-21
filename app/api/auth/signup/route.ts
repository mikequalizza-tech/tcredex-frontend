import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, role, organizationName } = body;

    if (!userId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create role-specific profile (no organization)
    const roleTable = role === 'sponsor' ? 'sponsors'
      : role === 'cde' ? 'cdes'
      : 'investors';

    const { error: roleError } = await supabaseAdmin
      .from(roleTable)
      .insert({
        primary_contact_name: name || email.split('@')[0],
        primary_contact_email: email,
      });

    if (roleError) {
      console.error('Role profile creation error:', roleError);
      return NextResponse.json({ error: 'Failed to create role profile', details: roleError }, { status: 500 });
    }

    // 2. Create user profile (no organization)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        role_type: role,
        role: 'ORG_ADMIN',
      });

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json({ error: 'Failed to create user', details: userError }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
