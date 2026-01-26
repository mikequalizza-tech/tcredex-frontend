import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch participants for a deal's closing room
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("dealId");

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get deal to find sponsor org (via sponsor_id join)
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("sponsor_id, assigned_cde_id, sponsors!inner(organization_id)")
      .eq("id", dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const typedDeal = deal as {
      sponsor_id: string;
      assigned_cde_id: string | null;
      sponsors: { organization_id: string } | null;
    };

    const sponsorOrgId = typedDeal.sponsors?.organization_id;
    if (!sponsorOrgId) {
      return NextResponse.json({ error: "Deal sponsor not found" }, { status: 404 });
    }

    const participants: {
      id: string;
      name: string;
      organization: string;
      role: string;
      online?: boolean;
    }[] = [];

    // Get sponsor org users
    const { data: sponsorUsers } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("organization_id", sponsorOrgId);

    // Get sponsor org name
    const { data: sponsorOrg } = await supabaseAdmin
      .from("sponsors")
      .select("primary_contact_name")
      .eq("organization_id", sponsorOrgId)
      .single();

    if (sponsorUsers) {
      for (const user of sponsorUsers) {
        const typedUser = user as {
          id: string;
          name: string;
          email: string;
        };
        participants.push({
          id: typedUser.id,
          name: typedUser.name || typedUser.email,
          organization: sponsorOrg?.primary_contact_name || "Sponsor",
          role: "Sponsor",
          online: false,
        });
      }
    }

    // Get CDE org users if assigned
    if (typedDeal.assigned_cde_id) {
      const { data: cde } = await supabaseAdmin
        .from("cdes")
        .select("id, primary_contact_name")
        .eq("id", typedDeal.assigned_cde_id)
        .single();

      if (cde) {
        const { data: cdeUsers } = await supabaseAdmin
          .from("users")
          .select("id, name, email")
          .eq("organization_id", cde.id);

        if (cdeUsers) {
          for (const user of cdeUsers) {
            const typedUser = user as {
              id: string;
              name: string;
              email: string;
            };
            participants.push({
              id: typedUser.id,
              name: typedUser.name || typedUser.email,
              organization: cde.primary_contact_name || "CDE",
              role: "CDE",
              online: false,
            });
          }
        }
      }
    }

    // Get investors with commitments to this deal
    const { data: commitments } = await supabaseAdmin
      .from("investor_commitments")
      .select("investor_id")
      .eq("deal_id", dealId);

    if (commitments) {
      const investorIds = new Set(
        commitments
          .map((c: any) => c.investor_id)
          .filter(Boolean)
      );

      for (const investorId of investorIds) {
        const { data: investor } = await supabaseAdmin
          .from("investors")
          .select("id, primary_contact_name")
          .eq("id", investorId)
          .single();

        if (investor) {
          const { data: investorUsers } = await supabaseAdmin
            .from("users")
            .select("id, name, email")
            .eq("organization_id", investor.id);

          if (investorUsers) {
            for (const user of investorUsers) {
              const typedUser = user as {
                id: string;
                name: string;
                email: string;
              };
              participants.push({
                id: typedUser.id,
                name: typedUser.name || typedUser.email,
                organization: investor.primary_contact_name || "Investor",
                role: "Investor",
                online: false,
              });
            }
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
