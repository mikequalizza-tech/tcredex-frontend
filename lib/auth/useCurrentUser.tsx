"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Role, AuthContext, hasMinimumRole, Organization, ProjectAssignment } from './types';

export interface ExtendedAuthContext extends AuthContext {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  needsRegistration: boolean; // True when user is authenticated but not in database
}

const normalizeOrgType = (type?: string | null): 'sponsor' | 'cde' | 'investor' | 'admin' | undefined => {
  if (!type) return undefined;

    if (type === 'sponsor' || type === 'cde' || type === 'investor' || type === 'admin') return type;
    return undefined;
  };
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (!session?.user) {
        setDbUserData(null);
        setIsLoadingDbData(false);
      }
    });

  useEffect(() => {
    if (authLoaded && supabaseUser) {
      fetchDbUserData();
    } else if (authLoaded && !supabaseUser) {
      setDbUserData(null);
      setIsLoadingDbData(false);
    }
  }, [authLoaded, supabaseUser, fetchDbUserData]);

  const isLoading = !authLoaded || isLoadingDbData;
  return {
    user,
    isLoading,
    isAuthenticated,
    needsRegistration,
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
    orgType: organization?.type || 'sponsor',
    orgName: organization?.name || '',
    orgLogo: organization?.logo,
    organizationId: organization?.id,
    userId: user?.id,
    userName: user?.name || '',
    userEmail: user?.email || '',
  };
}
  const isAuthenticated = !!supabaseUser;

  // Build the user object from Supabase + DB data using useMemo
  const { user, organization, orgType, userRole } = useMemo(() => {
    const normalizedOrgType = normalizeOrgType(dbUserData?.orgType);
    const mappedUserRole = mapUserRoleToRole(dbUserData?.role);
    let userData: User | null = null;
    if (supabaseUser && dbUserData) {
      userData = {
        id: supabaseUser.id,
        email: dbUserData.email || supabaseUser.email || '',
        name: dbUserData.name || (supabaseUser.user_metadata?.name as string) || 'User',
        avatar: dbUserData.avatarUrl,
        role: mappedUserRole,
        organizationId: dbUserData.organizationId,
        organization: dbUserData.organization,
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
  // Dummy implementation for checkProjectAccess
  const checkProjectAccess = useCallback((user: User, projectId: string, requiredRole: 'viewer' | 'member' | 'admin') => {
    // TODO: Implement actual project access logic
    return true;
  }, []);

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
    needsRegistration,
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
    orgType: organization?.type || 'sponsor',
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
