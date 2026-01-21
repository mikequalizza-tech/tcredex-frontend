import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET - Fetch conversations
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'team';
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  // Handle Clerk org IDs (start with 'org_') - user needs registration, return empty
  if (organizationId.startsWith('org_') || organizationId === 'pending') {
    return NextResponse.json({ conversations: [] });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch conversations where user's org is a participant
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        type,
        category,
        name,
        deal_id,
        deal_name,
        last_message,
        last_message_at,
        created_at,
        conversation_participants!inner (
          organization_id,
          user_id,
          user_name,
          organization_name,
          role,
          unread_count
        )
      `)
      .eq('category', category)
      .eq('conversation_participants.organization_id', organizationId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // Format the response
    const formattedConversations = (conversations || []).map((conv: any) => {
      const myParticipant = conv.conversation_participants.find(
        (p: any) => p.organization_id === organizationId
      );
      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        deal_id: conv.deal_id,
        deal_name: conv.deal_name,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        unread_count: myParticipant?.unread_count || 0,
        participants: conv.conversation_participants.map((p: any) => ({
          user_id: p.user_id,
          name: p.user_name,
          organization: p.organization_name,
          role: p.role,
        })),
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('[Conversations] Error fetching:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, category, participantIds, organizationId, creatorId, creatorName, creatorOrg, dealId, dealName } = body;

    if (!type || !participantIds || participantIds.length === 0 || !organizationId) {
      return NextResponse.json({ error: 'type, participantIds, and organizationId required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        type,
        category: category || type,
        name: `${creatorOrg} - ${type.charAt(0).toUpperCase() + type.slice(1)} Chat`,
        deal_id: dealId || null,
        deal_name: dealName || null,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add creator as participant
    const participants = [
      {
        conversation_id: (conversation as { id: string }).id,
        user_id: creatorId || authUser.id,
        organization_id: organizationId,
        user_name: creatorName,
        organization_name: creatorOrg,
        role: 'owner',
        unread_count: 0,
      },
    ];

    // Add other participants
    for (const participant of participantIds) {
      const participantData = typeof participant === 'object' ? participant : { id: participant };
      participants.push({
        conversation_id: (conversation as { id: string }).id,
        user_id: participantData.userId || participantData.id,
        organization_id: participantData.organizationId || participantData.id,
        user_name: participantData.name || 'Participant',
        organization_name: participantData.organization || 'Organization',
        role: 'member',
        unread_count: 0,
      });
    }

    const { error: partError } = await supabaseAdmin
      .from('conversation_participants')
      .insert(participants);

    if (partError) throw partError;

    return NextResponse.json({
      conversation: {
        id: (conversation as { id: string }).id,
        type: (conversation as { type: string }).type,
        name: (conversation as { name: string }).name,
        deal_id: (conversation as { deal_id: string | null }).deal_id,
        deal_name: (conversation as { deal_name: string | null }).deal_name,
        unread_count: 0,
        participants: participants.map(p => ({
          user_id: p.organization_id,
          name: p.user_name,
          organization: p.organization_name,
          role: p.role,
        })),
      },
    });
  } catch (error) {
    console.error('[Conversations] Error creating:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
