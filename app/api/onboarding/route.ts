import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { organizationType, organizationName } = await request.json();

    if (!organizationType || !organizationName) {
      return NextResponse.json(
        { error: "organizationType and organizationName required" },
        { status: 400 }
      );
    }

    const validTypes = ["sponsor", "cde", "investor"];
    if (!validTypes.includes(organizationType)) {
      return NextResponse.json(
        { error: "Invalid organization type" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already onboarded" },
        { status: 400 }
      );
    }

    // Get user info from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    const userName = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
      : userEmail?.split("@")[0] || "User";

    // Generate a unique slug from the organization name
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create organization first
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: organizationName,
        slug: uniqueSlug,
        type: organizationType,
      })
      .select()
      .single();

    if (orgError) {
      console.error("[Onboarding] Org creation error:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Create user with org link
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        clerk_id: userId,
        email: userEmail,
        name: userName,
        role: "ORG_ADMIN", // First user of org is admin
        organization_id: (org as { id: string }).id,
      })
      .select()
      .single();

    if (userError) {
      console.error("[Onboarding] User creation error:", userError);
      // Cleanup org if user creation failed
      await supabase.from("organizations").delete().eq("id", (org as { id: string }).id);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // If CDE, create CDE record
    if (organizationType === "cde") {
      await supabase.from("cdes").insert({
        name: organizationName,
        organization_id: (org as { id: string }).id,
        status: "active",
      });
    }

    // If Investor, create investor record
    if (organizationType === "investor") {
      await supabase.from("investors").insert({
        name: organizationName,
        organization_id: (org as { id: string }).id,
        status: "active",
      });
    }

    const response = NextResponse.json({
      success: true,
      user: newUser,
      organization: org,
    });

    // Set cookie to mark onboarding as complete (middleware checks this)
    response.cookies.set('tcredex_onboarded', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error("[Onboarding] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if user needs onboarding
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: user } = await supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("clerk_id", userId)
      .single();

    return NextResponse.json({
      needsOnboarding: !user,
      user: user || null,
    });
  } catch (error) {
    console.error("[Onboarding] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
