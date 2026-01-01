/**
 * tCredex API - Messages
 * GET /api/messages?dealId=X - Get messages for a deal
 * POST /api/messages - Send a message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notify } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId is required' },
        { status: 400 }
      );
    }

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select(`
        id,
        deal_id,
        sender_id,
        sender_name,
        sender_org,
        content,
        attachments,
        created_at
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    type MessageRow = {
      id: string;
      deal_id: string;
      sender_id: string;
      sender_name: string;
      sender_org: string | null;
      content: string;
      attachments: unknown[] | null;
      created_at: string;
    };
    const messages = messagesData as MessageRow[] | null;

    if (error) {
      console.error('Messages query error:', error);
      return NextResponse.json([]);
    }

    const formatted = (messages || []).map(m => ({
      id: m.id,
      dealId: m.deal_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderOrg: m.sender_org,
      content: m.content,
      attachments: m.attachments,
      createdAt: m.created_at,
      isOwn: m.sender_id === user.id,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Messages error:', error);
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

    const { dealId, content, attachments } = await request.json();

    if (!dealId || !content) {
      return NextResponse.json(
        { error: 'dealId and content are required' },
        { status: 400 }
      );
    }

    // Get sender profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, organizations(name)')
      .eq('id', user.id)
      .single();

    type ProfileRow = { full_name: string | null; organizations: { name?: string } | null };
    const profile = profileData as ProfileRow | null;

    const senderName = profile?.full_name || user.email?.split('@')[0] || 'User';
    const senderOrg = profile?.organizations?.name || '';

    // Get deal info for notification
    const { data: dealData } = await supabase
      .from('deals')
      .select('project_name')
      .eq('id', dealId)
      .single();

    type DealRow = { project_name: string };
    const deal = dealData as DealRow | null;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        deal_id: dealId,
        sender_id: user.id,
        sender_name: senderName,
        sender_org: senderOrg,
        content,
        attachments: attachments || [],
        created_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Message creation error:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // 🔔 Emit notification to other deal participants
    try {
      await notify.newMessage(
        dealId,
        deal?.project_name || 'Deal',
        senderName
      );
    } catch (notifyError) {
      console.error('Notification error:', notifyError);
    }

    type MsgRow = {
      id: string;
      deal_id: string;
      sender_id: string;
      sender_name: string;
      sender_org: string | null;
      content: string;
      attachments: unknown[] | null;
      created_at: string;
    };
    const typedMessage = message as unknown as MsgRow;
    const formatted = {
      id: typedMessage.id,
      dealId: typedMessage.deal_id,
      senderId: typedMessage.sender_id,
      senderName: typedMessage.sender_name,
      senderOrg: typedMessage.sender_org,
      content: typedMessage.content,
      attachments: typedMessage.attachments,
      createdAt: typedMessage.created_at,
      isOwn: true,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
