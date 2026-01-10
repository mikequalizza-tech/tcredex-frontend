import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch channels for a deal's closing room
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("dealId");

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check if channels exist, if not create defaults
    const { data: existingChannels } = await supabase
      .from("closing_room_channels")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (!existingChannels || existingChannels.length === 0) {
      // Create default channels for this deal
      const defaultChannels = [
        { deal_id: dealId, name: "general", type: "text" },
        { deal_id: dealId, name: "documents", type: "text" },
        { deal_id: dealId, name: "questions", type: "text" },
        { deal_id: dealId, name: "meeting-room", type: "video" },
        { deal_id: dealId, name: "voice-chat", type: "audio" },
      ];

      const { data: newChannels, error } = await supabase
        .from("closing_room_channels")
        .insert(defaultChannels)
        .select();

      if (error) {
        console.error("[Channels] Error creating defaults:", error);
        // Return empty if table doesn't exist yet
        return NextResponse.json({ channels: [] });
      }

      return NextResponse.json({ channels: newChannels });
    }

    return NextResponse.json({ channels: existingChannels });
  } catch (error) {
    console.error("[Channels] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

// POST - Create a new channel
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { dealId, name, type } = await request.json();

    if (!dealId || !name) {
      return NextResponse.json(
        { error: "dealId and name required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: channel, error } = await supabase
      .from("closing_room_channels")
      .insert({
        deal_id: dealId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: type || "text",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("[Channels] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
