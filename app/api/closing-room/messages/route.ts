import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const MESSAGES_BATCH = 10;

// POST - Send a new message
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, fileUrl, roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: "content or fileUrl required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get user info from Clerk
    const user = await currentUser();
    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";

    // Get user's org name from our database
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, organizations(name)")
      .eq("clerk_id", userId)
      .single();

    const orgName = (userData as any)?.organizations?.name || "Unknown Org";

    // Insert message - Supabase Realtime will broadcast it
    const { data: message, error } = await supabase
      .from("closing_room_messages")
      .insert({
        room_id: roomId,
        sender_clerk_id: userId,
        sender_name: userName,
        sender_org_name: orgName,
        content: content?.trim() || "",
        file_url: fileUrl || null,
        deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Messages] Insert error:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[Messages] POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// GET - Fetch messages for a closing room channel
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const cursor = searchParams.get("cursor");

  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("closing_room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_BATCH);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("[Messages] Query error:", error);
      // Return empty if table doesn't exist yet
      return NextResponse.json({
        items: [],
        nextCursor: null,
      });
    }

    let nextCursor = null;
    if (messages && messages.length === MESSAGES_BATCH) {
      nextCursor = (messages[messages.length - 1] as { created_at: string }).created_at;
    }

    return NextResponse.json({
      items: messages?.reverse() || [],
      nextCursor,
    });
  } catch (error) {
    console.error("[Messages] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
