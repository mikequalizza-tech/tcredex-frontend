/**
 * tCredex API - Profile
 * GET /api/auth/profile
 *
 * SIMPLIFIED: Uses users_simplified table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile (role-driven only)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    type ProfileData = {
      id: string;
      full_name: string | null;
      role: string | null;
    };
    const profile = profileData as ProfileData | null;

    if (profileError || !profile) {
      // Return basic user info if profile doesn't exist
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'sponsor',
      });
    }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: profile.full_name || user.email?.split('@')[0],
        role: profile.role || 'sponsor',
      });
      id: user.id,
