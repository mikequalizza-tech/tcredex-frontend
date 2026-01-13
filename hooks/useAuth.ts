import { useEffect, useState } from "react";
import type { User } from "@/lib/auth/types";

// CRITICAL: Use the correct auth endpoint
const SESSION_API = "/api/auth/me"; 

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(SESSION_API, { credentials: "include" });
        if (!ignore) {
          if (res.ok) {
            const data = await res.json();
            // Handle the response structure from /api/auth/me
            setUser(data.user || null);
          } else if (res.status === 401) {
            // Not authenticated - this is expected for logged out users
            setUser(null);
          } else {
            // Other error
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            setError(errorData.error || 'Failed to fetch user');
            setUser(null);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('[useAuth] Error fetching user:', err);
          setError('Network error');
          setUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUser();
    return () => { ignore = true; };
  }, []);

  return { user, isAuthenticated: !!user, loading, error };
}