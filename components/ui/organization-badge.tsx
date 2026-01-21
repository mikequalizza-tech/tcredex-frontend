"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Briefcase, TrendingUp } from "lucide-react";

const orgTypeIcons = {
  sponsor: Building2,
  cde: Briefcase,
  investor: TrendingUp,
} as const;

interface OrgData {
  id: string;
  name: string;
  slug: string;
  type: "sponsor" | "cde" | "investor";
}

export function OrganizationBadge() {
  const { user: clerkUser, isLoaded } = useUser();
  const [org, setOrg] = useState<OrgData | null>(null);

  useEffect(() => {
    if (!isLoaded || !clerkUser?.id) return;

    const fetchOrg = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("users")
          .select(`
            organization_id,
            organizations:organization_id (
              id,
              name,
              slug,
              type
            )
          `)
          .eq("clerk_id", clerkUser.id)
          .single();

        if (data?.organizations) {
          const orgData = Array.isArray(data.organizations)
            ? data.organizations[0]
            : data.organizations;
          if (orgData) {
            setOrg(orgData as OrgData);
          }
        }
      } catch (err) {
        // Silently fail - org badge is optional UI
      }
    };

    fetchOrg();
  }, [clerkUser?.id, isLoaded]);

  if (!org) return null;

  const Icon = orgTypeIcons[org.type] || Building2;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
      <Icon className="h-3.5 w-3.5 text-indigo-400" />
      <span className="text-xs text-gray-300 max-w-[120px] truncate">
        {org.name}
      </span>
    </div>
  );
}
