import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch participants for a deal's closing room
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

    // Get deal to find sponsor org
    const { data: deal } = await supabase
      .from("deals")
      .select("sponsor_organization_id, assigned_cde_id")
      .eq("id", dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const typedDeal = deal as {
      sponsor_organization_id: string;
      assigned_cde_id: string | null;
    };

    const participants: {
      id: string;
      name: string;
      organization: string;
      role: string;
      online?: boolean;
    }[] = [];

    // Get sponsor org users
    const { data: sponsorUsers } = await supabase
      .from("users")
      .select("id, name, email, organization:organizations(name)")
      .eq("organization_id", typedDeal.sponsor_organization_id);

    if (sponsorUsers) {
      for (const user of sponsorUsers) {
        const typedUser = user as {
          id: string;
          name: string;
          email: string;
          organization: { name: string };
        };
        participants.push({
          id: typedUser.id,
          name: typedUser.name || typedUser.email,
          organization: typedUser.organization?.name || "Sponsor",
          role: "Sponsor",
          online: false,
        });
      }
    }

    // Get CDE org users if assigned
    if (typedDeal.assigned_cde_id) {
      const { data: cde } = await supabase
        .from("cdes")
        .select("organization_id")
        .eq("id", typedDeal.assigned_cde_id)
        .single();

      if (cde) {
        const { data: cdeUsers } = await supabase
          .from("users")
          .select("id, name, email, organization:organizations(name)")
          .eq("organization_id", (cde as { organization_id: string }).organization_id);

        if (cdeUsers) {
          for (const user of cdeUsers) {
            const typedUser = user as {
              id: string;
              name: string;
              email: string;
              organization: { name: string };
            };
            participants.push({
              id: typedUser.id,
              name: typedUser.name || typedUser.email,
              organization: typedUser.organization?.name || "CDE",
              role: "CDE",
              online: false,
            });
          }
        }
      }
    }

    // Get investors with commitments to this deal
    const { data: commitments } = await supabase
      .from("investor_commitments")
      .select("investor:investors(organization_id)")
      .eq("deal_id", dealId);

    if (commitments) {
      const investorOrgIds = new Set(
        commitments
          .map((c: any) => c.investor?.organization_id)
          .filter(Boolean)
      );

      for (const orgId of investorOrgIds) {
        const { data: investorUsers } = await supabase
          .from("users")
          .select("id, name, email, organization:organizations(name)")
          .eq("organization_id", orgId);

        if (investorUsers) {
          for (const user of investorUsers) {
            const typedUser = user as {
              id: string;
              name: string;
              email: string;
              organization: { name: string };
            };
            participants.push({
              id: typedUser.id,
              name: typedUser.name || typedUser.email,
              organization: typedUser.organization?.name || "Investor",
              role: "Investor",
              online: false,
            });
          }
        }
      }
    }

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("[Participants] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
