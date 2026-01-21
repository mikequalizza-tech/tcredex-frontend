"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Role, AuthContext, hasMinimumRole, Organization, ProjectAssignment } from './types';

export interface ExtendedAuthContext extends AuthContext {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
  switchRole: (role: 'sponsor' | 'cde' | 'investor' | 'admin') => void;
  currentDemoRole: 'sponsor' | 'cde' | 'investor' | 'admin' | null;
  orgType: 'cde' | 'sponsor' | 'investor' | 'admin' | undefined;
  orgName: string;
  orgLogo?: string;
  organizationId: string | undefined;
  userId: string | undefined;
  userName: string;
  userEmail: string;
}

const normalizeOrgType = (type?: string | null): 'sponsor' | 'cde' | 'investor' | 'admin' | undefined => {
  if (!type) return undefined;
  const lower = type.toLowerCase();
  if (['sponsor', 'cde', 'investor', 'admin'].includes(lower)) {
    return lower as 'sponsor' | 'cde' | 'investor' | 'admin';
  }
  return undefined;
};

// Map user role to permission level
const mapUserRoleToRole = (userRole?: string | null): Role => {
  if (!userRole) return Role.VIEWER;

  const upper = userRole.toUpperCase();
  if (upper === 'ORG_ADMIN' || upper === 'ORG:ADMIN' || upper === 'ADMIN') return Role.ORG_ADMIN;
  if (upper === 'PROJECT_ADMIN') return Role.PROJECT_ADMIN;
  if (upper === 'MEMBER') return Role.MEMBER;
  if (upper === 'VIEWER') return Role.VIEWER;

  // Default to MEMBER for unknown roles (authenticated users get base access)
  return Role.MEMBER;
};

/**
 * Supabase-based useCurrentUser hook
 *
 * This hook provides authentication context using Supabase Auth.
 * It fetches user data from the database and maps it to the ExtendedAuthContext interface.
 */
export function useCurrentUser(): ExtendedAuthContext {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [dbUserData, setDbUserData] = useState<{
    id?: string;
    organizationId?: string;
    orgType?: string;  // role_type from users table (sponsor | cde | investor)
    orgName?: string;
    orgLogo?: string;
    role?: string;     // user role (ORG_ADMIN, MEMBER, etc.)
    name?: string;
    email?: string;
    avatarUrl?: string;
    projectAssignments?: ProjectAssignment[];
  } | null>(null);
  const [isLoadingDbData, setIsLoadingDbData] = useState(true);

  // Initialize Supabase auth listener
  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
      setAuthLoaded(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (!session?.user) {
        setDbUserData(null);
        setIsLoadingDbData(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch additional user data from our database
  const fetchDbUserData = useCallback(async () => {
    if (!supabaseUser?.id) {
      setDbUserData(null);
      setIsLoadingDbData(false);
      return;
    }

    try {
      const supabase = createClient();

      // Fetch user from database
      const { data: userRecord, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          organization_id,
          role_type,
          avatar_url
        `)
        .eq('id', supabaseUser.id)
        .single();

      if (error || !userRecord) {
        console.error('[Auth] Error fetching user from DB:', error);
        setDbUserData(null);
        setIsLoadingDbData(false);
        return;
      }

      // Fetch organization data from the correct role table
      let orgData = null;
      if (userRecord.organization_id && userRecord.role_type) {
        const roleTable = userRecord.role_type === 'sponsor'
          ? 'sponsors'
          : userRecord.role_type === 'cde'
            ? 'cdes'
            : 'investors';

        const { data: org } = await supabase
          .from(roleTable)
          .select('id, primary_contact_name')
          .eq('id', userRecord.organization_id)
          .single();

        if (org) {
          orgData = {
            id: org.id,
            name: org.primary_contact_name || 'Organization',
          };
        }
      }

      setDbUserData({
        id: userRecord.id,
        organizationId: userRecord.organization_id,
        orgType: userRecord.role_type,
        orgName: orgData?.name || 'Organization',
        role: userRecord.role,
        name: userRecord.name,
        email: userRecord.email,
        avatarUrl: userRecord.avatar_url,
        projectAssignments: [],
      });
    } catch (err) {
      console.error('[Auth] Error fetching DB user data:', err);
    } finally {
      setIsLoadingDbData(false);
    }
  }, [supabaseUser?.id]);

  useEffect(() => {
    if (authLoaded && supabaseUser) {
      fetchDbUserData();
    } else if (authLoaded && !supabaseUser) {
      setDbUserData(null);
      setIsLoadingDbData(false);
    }
  }, [authLoaded, supabaseUser, fetchDbUserData]);

  const isLoading = !authLoaded || isLoadingDbData;
  const isAuthenticated = !!supabaseUser;

  // Build the user object from Supabase + DB data using useMemo
  const { user, organization, orgType, userRole } = useMemo(() => {
    const normalizedOrgType = normalizeOrgType(dbUserData?.orgType);
    const mappedUserRole = mapUserRoleToRole(dbUserData?.role);

    // Build organization with a default type if none specified
    const org: Organization = {
      id: dbUserData?.organizationId || 'org-unknown',
      name: dbUserData?.orgName || 'Organization',
      slug: 'org',
      logo: dbUserData?.orgLogo,
      type: normalizedOrgType || 'sponsor', // Default type for compatibility
    };

    let userData: User | null = null;
    if (supabaseUser && dbUserData) {
      userData = {
        id: supabaseUser.id,
        email: dbUserData.email || supabaseUser.email || '',
        name: dbUserData.name || (supabaseUser.user_metadata?.name as string) || 'User',
        avatar: dbUserData.avatarUrl,
        role: mappedUserRole,
        organizationId: org.id,
        organization: org,
        projectAssignments: dbUserData?.projectAssignments || [],
        createdAt: supabaseUser.created_at || new Date().toISOString(),
        lastLoginAt: supabaseUser.last_sign_in_at,
      };
    }

    return {
      user: userData,
      organization: userData ? org : undefined,
      orgType: normalizedOrgType,
      userRole: mappedUserRole,
    };
  }, [supabaseUser, dbUserData]);

  // Helper function for project access check (defined first to be used in callbacks)
  const checkProjectAccess = useCallback((
    currentUser: User | null,
    projectId: string,
    requiredRole: 'admin' | 'member' | 'viewer' = 'viewer'
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === Role.ORG_ADMIN) return true;
    const assignment = currentUser.projectAssignments.find(p => p.projectId === projectId);
    if (!assignment) return false;
    const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
    return roleHierarchy[assignment.role] >= roleHierarchy[requiredRole];
  }, []);

  // Permission methods
  const canViewDocument = useCallback((documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId) return checkProjectAccess(user, projectId, 'viewer');
    return hasMinimumRole(user.role, Role.VIEWER);
  }, [user, checkProjectAccess]);

  const canEditDocument = useCallback((documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId && user.role === Role.PROJECT_ADMIN) return checkProjectAccess(user, projectId, 'admin');
    if (projectId && user.role === Role.MEMBER) return checkProjectAccess(user, projectId, 'member');
    return false;
  }, [user, checkProjectAccess]);

  const canDeleteDocument = useCallback((documentOwnerId: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    return documentOwnerId === user.id && hasMinimumRole(user.role, Role.PROJECT_ADMIN);
  }, [user]);

  const canShareDocument = useCallback((documentOwnerId: string): boolean => {
    if (!user) return false;
    if (hasMinimumRole(user.role, Role.PROJECT_ADMIN)) return true;
    return documentOwnerId === user.id;
  }, [user]);

  const canUploadDocument = useCallback((projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.VIEWER) return false;
    if (hasMinimumRole(user.role, Role.PROJECT_ADMIN)) return true;
    if (projectId) return checkProjectAccess(user, projectId, 'member');
    return user.role === Role.MEMBER;
  }, [user, checkProjectAccess]);

  const canManageTeam = useCallback((): boolean => user?.role === Role.ORG_ADMIN, [user]);
  const canManageSettings = useCallback((): boolean => !!user && hasMinimumRole(user.role, Role.PROJECT_ADMIN), [user]);

  const hasProjectAccess = useCallback((projectId: string, requiredRole: 'admin' | 'member' | 'viewer' = 'viewer'): boolean => {
    return checkProjectAccess(user, projectId, requiredRole);
  }, [user, checkProjectAccess]);

  // Auth actions
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error('[Auth] login error', err);
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Redirect to home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('[Auth] logout error', err);
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchDbUserData();
  }, [fetchDbUserData]);

  const switchRole = useCallback((_role: 'sponsor' | 'cde' | 'investor' | 'admin') => {
    // Role switching disabled; real role comes from database
    console.warn('[Auth] switchRole is disabled; use database for role management.');
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    canViewDocument,
    canEditDocument,
    canDeleteDocument,
    canShareDocument,
    canUploadDocument,
    canManageTeam,
    canManageSettings,
    hasProjectAccess,
    login,
    logout,
    refresh,
    switchRole,
    currentDemoRole: null,
    orgType: organization?.type,
    orgName: organization?.name || '',
    orgLogo: organization?.logo,
    organizationId: organization?.id,
    userId: user?.id,
    userName: user?.name || '',
    userEmail: user?.email || '',
  };
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>, requiredRole?: Role) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useCurrentUser();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
      return null;
    }

    if (requiredRole && user && !hasMinimumRole(user.role, requiredRole)) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h1>
            <p className="text-gray-400">You don&apos;t have permission to view this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Re-export for backward compatibility
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
