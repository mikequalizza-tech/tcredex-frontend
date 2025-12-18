/**
 * tCredex API - Messages
 * GET /api/messages?dealId=X - Get messages for a deal
 * POST /api/messages - Send a message
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notify } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
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

    const { data: messages, error } = await supabase
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
    const supabase = supabaseAdmin;
    
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, organizations(name)')
      .eq('id', user.id)
      .single();

    const senderName = profile?.full_name || user.email?.split('@')[0] || 'User';
    const senderOrg = (profile?.organizations as { name?: string })?.name || '';

    // Get deal info for notification
    const { data: deal } = await supabase
      .from('deals')
      .select('project_name')
      .eq('id', dealId)
      .single();

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
      })
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

    const formatted = {
      id: message.id,
      dealId: message.deal_id,
      senderId: message.sender_id,
      senderName: message.sender_name,
      senderOrg: message.sender_org,
      content: message.content,
      attachments: message.attachments,
      createdAt: message.created_at,
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
