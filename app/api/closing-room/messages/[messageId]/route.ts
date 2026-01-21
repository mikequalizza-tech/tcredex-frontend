import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// PATCH - Update a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId } = await params;
    const { content, roomId } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("closing_room_messages")
      .select("sender_id")
      .eq("id", messageId)
      .single();

    if (!existing || (existing as any).sender_id !== authUser.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update message - Supabase Realtime will broadcast it
    const { data: message, error } = await supabaseAdmin
      .from("closing_room_messages")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("[Messages] Update error:", error);
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[Messages] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// DELETE - Soft delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messageId } = await params;

    const supabaseAdmin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("closing_room_messages")
      .select("sender_id")
      .eq("id", messageId)
      .single();

    if (!existing || (existing as any).sender_id !== authUser.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Soft delete - Supabase Realtime will broadcast the update
    const { error } = await supabaseAdmin
      .from("closing_room_messages")
      .update({
        content: "This message has been deleted",
        deleted: true,
        file_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("[Messages] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Messages] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
