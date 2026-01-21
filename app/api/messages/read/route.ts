import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST - Mark messages as read
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, userId, organizationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Reset unread count for this participant
    const userIdToUse = userId || organizationId || authUser.id;
    if (userIdToUse) {
      // Update by user_id
      const { error: partError } = await supabaseAdmin
        .from('conversation_participants')
        .update({
          unread_count: 0,
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', userIdToUse);

      if (partError) {
        console.error('[Messages] Error resetting unread:', partError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Messages] Error marking read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
