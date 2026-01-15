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

    // Check if user already exists by clerk_id
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("clerk_id", userId)
      .single();

    if (existingUser) {
      // User already onboarded - set cookie and return success (don't error)
      // This fixes the stuck loop when cookie was lost but user exists
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id, type")
        .eq("id", existingUser.organization_id)
        .single();

      const response = NextResponse.json({
        success: true,
        alreadyOnboarded: true,
        user: existingUser,
        organization: existingOrg,
      });

      // Set the cookie they're missing
      response.cookies.set('tcredex_onboarded', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });

      return response;
    }

    // Get user info from Clerk first (we need the email to check for invites)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    // Check if user was INVITED (has a user record by email with org_id already assigned)
    // This happens when an admin invites them via /dashboard/teams
    if (userEmail) {
      const { data: invitedUser } = await supabase
        .from("users")
        .select("id, organization_id, role, email")
        .eq("email", userEmail)
        .single();

      if (invitedUser && invitedUser.organization_id) {
        // User was invited! Update their record with clerk_id instead of creating new org
        const { error: updateError } = await supabase
          .from("users")
          .update({
            clerk_id: userId,
            name: clerkUser.firstName
              ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
              : userEmail?.split("@")[0] || "User",
            is_active: true,
          })
          .eq("id", invitedUser.id);

        if (updateError) {
          console.error("[Onboarding] Invited user update error:", updateError);
          return NextResponse.json(
            { error: "Failed to activate invited user" },
            { status: 500 }
          );
        }

        // Get their existing organization
        const { data: invitedOrg } = await supabase
          .from("organizations")
          .select("id, name, type, slug")
          .eq("id", invitedUser.organization_id)
          .single();

        const response = NextResponse.json({
          success: true,
          wasInvited: true,
          user: { ...invitedUser, clerk_id: userId },
          organization: invitedOrg,
        });

        // Set the onboarding cookie
        response.cookies.set('tcredex_onboarded', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365,
        });

        console.log(`[Onboarding] Invited user ${userEmail} activated in org ${invitedOrg?.name}`);
        return response;
      }
    }

    // If we get here, user is NOT invited - they need to create their own org
    // (clerkUser is already fetched above)
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
