"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface CurrentUserData {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    type: "sponsor" | "cde" | "investor";
  } | null;
}

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [hasQueryClient, setHasQueryClient] = useState(false);

  // Check if QueryClient exists (for static pages that don't have it)
  useEffect(() => {
    setHasQueryClient(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["current-user", clerkUser?.id],
    queryFn: async (): Promise<CurrentUserData | null> => {
      if (!clerkUser?.id) return null;

      const supabase = createClient();
      const { data: userData, error } = await supabase
        .from("users")
        .select(`
          id,
          clerk_id,
          email,
          name,
          role,
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

      if (error || !userData) return null;

      // Supabase may return organization as array or object depending on relation
      const orgs = userData.organizations as unknown;
      const org = Array.isArray(orgs) ? orgs[0] : orgs;
      const orgData = org as { id: string; name: string; slug: string; type: string } | null | undefined;

      return {
        id: userData.id,
        clerk_id: userData.clerk_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organization_id: userData.organization_id,
        organization: orgData ? {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          type: orgData.type as "sponsor" | "cde" | "investor",
        } : null,
      };
    },
    enabled: !!clerkUser?.id && clerkLoaded && hasQueryClient,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: data,
    clerkUser,
    isLoading: !clerkLoaded || isLoading,
    error,
    isAuthenticated: !!clerkUser,
  };
}
