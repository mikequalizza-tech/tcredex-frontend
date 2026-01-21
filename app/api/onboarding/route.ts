import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/onboarding
 *
 * Creates a new organization in the correct role table (sponsors/cdes/investors)
 * and creates the user as ORG_ADMIN linked to that organization.
 *
 * Flow:
 * 1. User signs up via Supabase Auth (user created in Supabase Auth)
 * 2. User selects role (sponsor/cde/investor) in onboarding UI
 * 3. This API creates record in role table + user record
 *
 * Tables used:
 * - sponsors/cdes/investors: Organization profiles (one per org)
 * - users: All people, linked via organization_id to role table
 */
export async function POST(request: NextRequest) {
  // Get Supabase auth session
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roleType } = await request.json();

    if (!roleType) {
      return NextResponse.json(
        { error: "roleType required" },
        { status: 400 }
      );
    }

    const validTypes = ["sponsor", "cde", "investor"];
    if (!validTypes.includes(roleType)) {
      return NextResponse.json(
        { error: "Invalid role type" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if user already exists and is fully onboarded
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, role_type, email")
      .eq("id", authUser.id)
      .single();

    // If user exists AND has role_type, they're already onboarded
    if (existingUser?.role_type) {
      return NextResponse.json(
        { error: "User already onboarded" },
        { status: 400 }
      );
    }

    // Get user info from auth
    const userEmail = authUser.email;
    const userName = authUser.user_metadata?.name
      || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim()
      || userEmail?.split("@")?.[0]
      || "User";

    // Determine which table to insert into based on role
    const roleTable = roleType === "sponsor"
      ? "sponsors"
      : roleType === "cde"
        ? "cdes"
        : "investors";

    // Create role profile (no organization)
    await supabaseAdmin.from(roleTable).insert({
      primary_contact_name: userName,
      primary_contact_email: userEmail,
    });

    // Create user record (no organization)
    await supabaseAdmin.from("users").insert({
      id: authUser.id,
      email: userEmail,
      name: userName,
      role_type: roleType,
      role: "ORG_ADMIN",
    });

    return NextResponse.json({ success: true });
    let newUser;
    let userError;

    if (existingUser) {
      // User exists but not fully onboarded - update them
      const userId = existingUser!.id;
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          name: userName,
          role: "ORG_ADMIN",
          role_type: roleType,
        })
        .eq("id", userId)
        .select()
        .single();
      newUser = data;
      userError = error;
    } else {
      // Create new user with Supabase Auth ID
      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({
          id: authUser!.id,  // Use Supabase Auth ID
          email: userEmail,
          name: userName,
          role: "ORG_ADMIN",
          role_type: roleType,
        })
        .select()
        .single();
      newUser = data;
      userError = error;
    }

    if (userError) {
      console.error("[Onboarding] User creation/update error:", userError);
      console.error("[Onboarding] Attempted insert data:", {
        id: authUser!.id,
        email: userEmail,
        name: userName,
        // organization_id: organizationId, // Remove if not used
        // role_type: organizationType, // Remove if not used
      });
      // Cleanup role table record if user creation failed
      // No organizationId to clean up in role-driven flow
      return NextResponse.json(
        { error: `Failed to create user: ${userError.message}` },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: newUser,
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
  // Get Supabase auth session
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, organization_id, role, role_type")
      .eq("id", authUser.id)
      .single();

    return NextResponse.json({
      needsOnboarding: !user || !user.organization_id || !user.role_type,
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
