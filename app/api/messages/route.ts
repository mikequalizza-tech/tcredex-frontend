import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify user is a participant in this conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('clerk_id', userId)
      .single();

    // Also check by user_id for existing participants
    if (!participant) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (user) {
        const { data: participantByUser } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('user_id', (user as { id: string }).id)
          .single();

        if (!participantByUser) {
          return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
      }
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('[Messages] Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, content, senderId, senderName, senderOrg } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_clerk_id: userId,
        sender_name: senderName || 'User',
        sender_org: senderOrg || 'Organization',
        sender_org_id: body.senderOrgId || null,
        content,
        message_type: 'text',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update conversation's last_message
    await supabase
      .from('conversations')
      .update({
        last_message: content.substring(0, 100),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return NextResponse.json({ message });
  } catch (error) {
    console.error('[Messages] Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
