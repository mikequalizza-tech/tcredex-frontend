/**
 * tCredex API - Notifications
 * GET /api/notifications - Get user notifications
 * POST /api/notifications/read-all - Mark all as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: notificationsData, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    type NotificationRow = {
      id: string;
      type: string | null;
      title: string;
      body: string;
      deal_id: string | null;
      read: boolean | null;
      created_at: string;
    };
    const notifications = notificationsData as NotificationRow[] | null;

    if (error) {
      console.error('Notifications query error:', error);
      // Return empty array if table doesn't exist yet
      return NextResponse.json([]);
    }

    // Transform to mobile-friendly format
    const formatted = (notifications || []).map(n => ({
      id: n.id,
      type: n.type || 'status',
      title: n.title,
      body: n.body,
      dealId: n.deal_id,
      read: n.read || false,
      createdAt: n.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as never)
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Mark all read error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
