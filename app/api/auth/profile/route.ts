/**
 * tCredex API - Profile
 * GET /api/auth/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile with organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Return basic user info if profile doesn't exist
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'sponsor',
        organization: null,
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: profile.full_name || user.email?.split('@')[0],
      role: profile.role || 'sponsor',
      organization: profile.organizations ? {
        id: profile.organizations.id,
        name: profile.organizations.name,
        type: profile.organizations.type,
      } : null,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
