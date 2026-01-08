"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Role, AuthContext, hasMinimumRole } from './types';

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
  userName: string;
  userEmail: string;
}

const AuthContextValue = createContext<ExtendedAuthContext | undefined>(undefined);

const normalizeOrgType = (type?: string): 'sponsor' | 'cde' | 'investor' | 'admin' | undefined => {
  if (!type) return undefined;
  const lower = type.toLowerCase();
  if (['sponsor', 'cde', 'investor', 'admin'].includes(lower)) {
    return lower as 'sponsor' | 'cde' | 'investor' | 'admin';
  }
  return undefined;
};

// Map user role to permission level
const mapUserRoleToRole = (userRole?: string): Role => {
  if (!userRole) return Role.VIEWER;
  
  const upper = userRole.toUpperCase();
  if (upper === 'ORG_ADMIN') return Role.ORG_ADMIN;
  if (upper === 'PROJECT_ADMIN') return Role.PROJECT_ADMIN;
  if (upper === 'MEMBER') return Role.MEMBER;
  if (upper === 'VIEWER') return Role.VIEWER;
  
  // Default to VIEWER for unknown roles
  return Role.VIEWER;
};

async function fetchMe(): Promise<User | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  const apiUser = data.user;
  if (!apiUser) return null;

  // CRITICAL: Validate org type is valid
  const orgType = normalizeOrgType(apiUser.organization?.type || apiUser.orgType);
  if (!orgType) {
    console.error('[Auth] Invalid organization type:', apiUser.organization?.type);
    return null;
  }

  // CRITICAL: Validate user role is valid
  const userRole = mapUserRoleToRole(apiUser.role);

  // CRITICAL: Validate organization exists
  if (!apiUser.organization?.id && !apiUser.organizationId) {
    console.error('[Auth] User has no organization');
    return null;
  }

  return {
    id: apiUser.id,
    email: apiUser.email,
    name: apiUser.name || 'User',
    role: userRole,
    organizationId: apiUser.organizationId || apiUser.organization?.id || '',
    organization: apiUser.organization ? {
      ...apiUser.organization,
      type: orgType,
    } : {
      id: apiUser.organizationId || 'org-unknown',
      name: 'Organization',
      slug: 'org',
      type: orgType,
    },
    projectAssignments: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await fetchMe();
      setUser(u);
    } catch (err) {
      console.error('[Auth] refresh error', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clean up any conflicting localStorage data on app startup
    if (typeof window !== 'undefined') {
      try {
        // Only clear if we detect mixed auth systems
        const hasOldSession = localStorage.getItem('tcredex_session');
        if (hasOldSession) {
          console.log('[Auth] Cleaning up old localStorage auth data');
          localStorage.removeItem('tcredex_session');
          localStorage.removeItem('tcredex_demo_role');
          localStorage.removeItem('tcredex_registered_user');
        }
      } catch (err) {
        console.error('[Auth] startup cleanup error', err);
      }
    }
    
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Invalid email or password' };
      }

      // Cookie is set server-side; just refresh state
      await refresh();
      return { success: true };
    } catch (error) {
      console.error('[Login] error', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[Auth] logout API error', err);
      // Continue with client-side cleanup even if API fails
    }
    
    // Clear client-side state
    setUser(null);
    
    // Clear any localStorage data that might cause conflicts
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = [
          'tcredex_session',
          'tcredex_demo_role', 
          'tcredex_registered_user',
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (err) {
        console.error('[Auth] localStorage cleanup error', err);
      }
      
      // Redirect to signin page
      window.location.href = '/signin';
    }
  }, []);

  const switchRole = useCallback((_role: 'sponsor' | 'cde' | 'investor' | 'admin') => {
    // Role switching disabled; real role comes from server
    console.warn('switchRole is disabled; log in with the correct account.');
  }, []);

  const canViewDocument = (documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId) return hasProjectAccess(projectId, 'viewer');
    return hasMinimumRole(user.role, Role.VIEWER);
  };

  const canEditDocument = (documentOwnerId: string, projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    if (documentOwnerId === user.id) return true;
    if (projectId && user.role === Role.PROJECT_ADMIN) return hasProjectAccess(projectId, 'admin');
    if (projectId && user.role === Role.MEMBER) return hasProjectAccess(projectId, 'member');
    return false;
  };

  const canDeleteDocument = (documentOwnerId: string): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    return documentOwnerId === user.id && hasMinimumRole(user.role, Role.PROJECT_ADMIN);
  };

  const canShareDocument = (documentOwnerId: string): boolean => {
    if (!user) return false;
    if (hasMinimumRole(user.role, Role.PROJECT_ADMIN)) return true;
    return documentOwnerId === user.id;
  };

  const canUploadDocument = (projectId?: string): boolean => {
    if (!user) return false;
    if (user.role === Role.VIEWER) return false;
    if (hasMinimumRole(user.role, Role.PROJECT_ADMIN)) return true;
    if (projectId) return hasProjectAccess(projectId, 'member');
    return user.role === Role.MEMBER;
  };

  const canManageTeam = (): boolean => user?.role === Role.ORG_ADMIN;
  const canManageSettings = (): boolean => !!user && hasMinimumRole(user.role, Role.PROJECT_ADMIN);

  const hasProjectAccess = (projectId: string, requiredRole: 'admin' | 'member' | 'viewer' = 'viewer'): boolean => {
    if (!user) return false;
    if (user.role === Role.ORG_ADMIN) return true;
    const assignment = user.projectAssignments.find(p => p.projectId === projectId);
    if (!assignment) return false;
    const roleHierarchy = { admin: 3, member: 2, viewer: 1 };
    return roleHierarchy[assignment.role] >= roleHierarchy[requiredRole];
  };

  const contextValue: ExtendedAuthContext = {
    user,
    isLoading,
    isAuthenticated: !!user,
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
    orgType: user?.organization?.type,
    orgName: user?.organization.name || '',
    orgLogo: user?.organization.logo,
    organizationId: user?.organizationId,
    userName: user?.name || '',
    userEmail: user?.email || '',
  };

  return <AuthContextValue.Provider value={contextValue}>{children}</AuthContextValue.Provider>;
}

export function useCurrentUser(): ExtendedAuthContext {
  const context = useContext(AuthContextValue);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within an AuthProvider');
  }
  return context;
}

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
