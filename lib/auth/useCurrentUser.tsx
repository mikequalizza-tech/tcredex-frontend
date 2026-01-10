"use client";

import { useUser, useAuth, useOrganization } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
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
 * Clerk-based useCurrentUser hook
 *
 * This hook provides a compatibility layer between Clerk and the app's existing auth interface.
 * It uses Clerk's hooks (useUser, useAuth, useOrganization) and maps the data to match
 * the ExtendedAuthContext interface that the rest of the app expects.
 */
export function useCurrentUser(): ExtendedAuthContext {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut, isLoaded: authLoaded } = useAuth();
  const { organization: clerkOrg, isLoaded: orgLoaded } = useOrganization();

  const [dbUserData, setDbUserData] = useState<{
    organizationId?: string;
    orgType?: string;
    orgName?: string;
    orgLogo?: string;
    role?: string;
    projectAssignments?: ProjectAssignment[];
  } | null>(null);
  const [isLoadingDbData, setIsLoadingDbData] = useState(true);

  // Fetch additional user data from our database (organization info, role, etc.)
  const fetchDbUserData = useCallback(async () => {
    if (!clerkUser?.id) {
      setDbUserData(null);
      setIsLoadingDbData(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setDbUserData({
            organizationId: data.user.organizationId || data.user.organization?.id,
            orgType: data.user.organization?.type || data.user.orgType,
            orgName: data.user.organization?.name || 'Organization',
            orgLogo: data.user.organization?.logo,
            role: data.user.role,
            projectAssignments: data.user.projectAssignments || [],
          });
        }
      }
    } catch (err) {
      console.error('[Auth] Error fetching DB user data:', err);
    } finally {
      setIsLoadingDbData(false);
    }
  }, [clerkUser?.id]);

  useEffect(() => {
    if (userLoaded && clerkUser) {
      fetchDbUserData();
    } else if (userLoaded && !clerkUser) {
      setDbUserData(null);
      setIsLoadingDbData(false);
    }
  }, [userLoaded, clerkUser, fetchDbUserData]);

  const isLoading = !userLoaded || !authLoaded || isLoadingDbData;
  const isAuthenticated = !!clerkUser;

  // Build the user object from Clerk + DB data
  const orgType = normalizeOrgType(dbUserData?.orgType);
  const userRole = mapUserRoleToRole(dbUserData?.role);

  const organization: Organization | undefined = orgType ? {
    id: dbUserData?.organizationId || clerkOrg?.id || 'org-unknown',
    name: dbUserData?.orgName || clerkOrg?.name || 'Organization',
    slug: clerkOrg?.slug || 'org',
    logo: dbUserData?.orgLogo || clerkOrg?.imageUrl,
    type: orgType,
  } : undefined;

  const user: User | null = clerkUser && organization ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    avatar: clerkUser.imageUrl,
    role: userRole,
    organizationId: organization.id,
    organization,
    projectAssignments: dbUserData?.projectAssignments || [],
    createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
    lastLoginAt: clerkUser.lastSignInAt?.toISOString(),
  } : null;

  // Permission methods
  const canViewDocument = useCallback((documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId) return hasProjectAccess(projectId, 'viewer');
    return hasMinimumRole(user.role, Role.VIEWER);
  }, [user]);

  const canEditDocument = useCallback((documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId && user.role === Role.PROJECT_ADMIN) return hasProjectAccess(projectId, 'admin');
    if (projectId && user.role === Role.MEMBER) return hasProjectAccess(projectId, 'member');
    return false;
  }, [user]);

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
    if (projectId) return hasProjectAccess(projectId, 'member');
    return user.role === Role.MEMBER;
  }, [user]);

  const canManageTeam = useCallback((): boolean => user?.role === Role.ORG_ADMIN, [user]);
  const canManageSettings = useCallback((): boolean => !!user && hasMinimumRole(user.role, Role.PROJECT_ADMIN), [user]);

  const hasProjectAccess = useCallback((projectId: string, requiredRole: 'admin' | 'member' | 'viewer' = 'viewer'): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    const assignment = user.projectAssignments.find(p => p.projectId === projectId);
    if (!assignment) return false;
    const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
    return roleHierarchy[assignment.role] >= roleHierarchy[requiredRole];
  }, [user]);

  // Auth actions
  const login = useCallback(async (_email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    // With Clerk, login is handled by Clerk's SignIn component
    // This is kept for interface compatibility but shouldn't be called directly
    console.warn('[Auth] login() called but Clerk handles authentication via SignIn component');
    return { success: false, error: 'Use Clerk SignIn component for authentication' };
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
      // Clerk handles the redirect
    } catch (err) {
      console.error('[Auth] logout error', err);
      // Fallback redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
  }, [signOut]);

  const refresh = useCallback(async () => {
    await fetchDbUserData();
  }, [fetchDbUserData]);

  const switchRole = useCallback((_role: 'sponsor' | 'cde' | 'investor' | 'admin') => {
    // Role switching disabled; real role comes from database
    console.warn('[Auth] switchRole is disabled; use Clerk Organizations for role management.');
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

// Re-export for backward compatibility - AuthProvider is no longer needed
// as ClerkProvider handles everything, but we export a no-op for any imports
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // With Clerk, ClerkProvider in layout.tsx handles auth context
  // This is a pass-through for backward compatibility
  return <>{children}</>;
}
