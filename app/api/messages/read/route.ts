import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST - Mark messages as read
export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, userId, organizationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Reset unread count for this participant
    const userIdToUse = userId || organizationId;
    if (userIdToUse) {
      // Try updating by user_id first
      const { error: partError } = await supabase
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

      // Also try by clerk_id for Clerk users
      await supabase
        .from('conversation_participants')
        .update({
          unread_count: 0,
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('clerk_id', clerkUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Messages] Error marking read:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
