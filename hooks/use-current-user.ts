"use client";

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
  const [user, setUser] = useState<CurrentUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(`
            id,
            email,
            name,
            role,
            role_type,
            organization_id,
            organizations:organization_id (
              id,
              name,
              slug,
              type
            )
          `)
          .eq("id", authUser.id)
          .single();
        if (userError || !userData) {
          setUser(null);
          setError(userError);
          setIsLoading(false);
          return;
        }
        const orgs = userData.organizations as unknown;
        const org = Array.isArray(orgs) ? orgs[0] : orgs;
        const orgData = org as { id: string; name: string; slug: string; type: string } | null | undefined;
        setUser({
          id: userData.id,
          clerk_id: userData.id,
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
        });
        setIsLoading(false);
      } catch (err) {
        setError(err);
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
