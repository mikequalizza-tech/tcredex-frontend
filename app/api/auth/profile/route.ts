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

    // User record type
    type UserRecord = {
      id: string;
      email: string;
      name: string;
      organization_id: string | null;
      organization_type: string | null;
      role: string;
    };

    // Get user from simplified table (no FK joins needed)
    const { data: userData, error: userError } = await supabase
      .from('users_simplified')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      // Return basic user info if record doesn't exist
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'sponsor',
        organizationId: null,
        organizationType: null,
      });
    }

    const typedUser = userData as UserRecord;

    // If user has an organization, get the entity name from the appropriate table
    let organizationName = null;
    if (typedUser.organization_id && typedUser.organization_type) {
      const tableName = typedUser.organization_type === 'sponsor' ? 'sponsors_simplified'
        : typedUser.organization_type === 'investor' ? 'investors_simplified'
        : 'cdes_merged';

      const { data: org } = await supabase
        .from(tableName)
        .select('name')
        .eq('organization_id', typedUser.organization_id)
        .single();

      organizationName = (org as { name: string } | null)?.name;
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: typedUser.name || user.email?.split('@')[0],
      role: typedUser.role || 'MEMBER',
      organizationId: typedUser.organization_id,
      organizationType: typedUser.organization_type,
      organizationName,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
