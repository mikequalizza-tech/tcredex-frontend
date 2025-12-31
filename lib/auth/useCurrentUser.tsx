'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Role, AuthContext, hasMinimumRole } from './types';

// Cookie helper functions for middleware auth
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// User cache for session restoration (populated from API)
let userCache: Record<string, User> = {};

export interface ExtendedAuthContext extends AuthContext {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'sponsor' | 'cde' | 'investor' | 'admin') => void;
  currentDemoRole: 'sponsor' | 'cde' | 'investor' | 'admin' | null;
  orgType: 'cde' | 'sponsor' | 'investor' | undefined;
  orgName: string;
  orgLogo?: string;
  organizationId: string | undefined;
  userName: string;
  userEmail: string;
}

const AuthContextValue = createContext<ExtendedAuthContext | undefined>(undefined);

function createUserFromSession(session: any): User {
  // If we have cached user data from API, use it
  if (session.email && userCache[session.email]) {
    return userCache[session.email];
  }

  // If session has full user data (from API response), use it
  if (session.user) {
    const apiUser = session.user;
    return {
      id: apiUser.id || 'u-' + Date.now(),
      email: apiUser.email,
      name: apiUser.name || 'User',
      role: apiUser.role === 'ORG_ADMIN' ? Role.ORG_ADMIN : Role.MEMBER,
      organizationId: apiUser.organizationId || 'org-temp',
      organization: apiUser.organization || {
        id: 'org-temp',
        name: 'Organization',
        slug: 'org',
        type: apiUser.userType || 'cde',
      },
      projectAssignments: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  // Fallback for legacy session data
  return {
    id: 'u-' + Date.now(),
    email: session.email || '',
    name: session.name || 'User',
    role: Role.ORG_ADMIN,
    organizationId: session.organizationId || 'org-temp',
    organization: session.organization || {
      id: 'org-temp',
      name: session.orgName || 'My Organization',
      slug: session.orgName?.toLowerCase().replace(/\s+/g, '-') || 'my-org',
      type: (session.userType || session.role || 'cde') as 'sponsor' | 'cde' | 'investor',
    },
    projectAssignments: [],
    createdAt: session.registeredAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDemoRole, setCurrentDemoRole] = useState<'sponsor' | 'cde' | 'investor' | 'admin' | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const savedSession = localStorage.getItem('tcredex_session');
          if (savedSession) {
            const session = JSON.parse(savedSession);
            const role = session.role as 'sponsor' | 'cde' | 'investor' | 'admin';
            setCurrentDemoRole(role);
            setUser(createUserFromSession(session));
            // Ensure cookie is synced for middleware
            setCookie('tcredex_session', savedSession);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Call the demo login API to authenticate against Supabase tables
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Create user from API response
        const apiUser = data.user;
        const role = apiUser.userType as 'sponsor' | 'cde' | 'investor' | 'admin';

        const userData: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: apiUser.role === 'ORG_ADMIN' ? Role.ORG_ADMIN : Role.MEMBER,
          organizationId: apiUser.organizationId || '',
          organization: apiUser.organization || {
            id: 'org-' + Date.now(),
            name: 'Organization',
            slug: 'org',
            type: role,
          },
          projectAssignments: [],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        // Cache the user for session restoration
        userCache[normalizedEmail] = userData;

        setCurrentDemoRole(role);
        setUser(userData);

        if (typeof window !== 'undefined') {
          const sessionData = {
            role,
            email: normalizedEmail,
            userType: role,
            user: apiUser,
            orgRole: apiUser.role,
          };
          localStorage.setItem('tcredex_session', JSON.stringify(sessionData));
          setCookie('tcredex_session', JSON.stringify(sessionData));
        }
        return { success: true };
      }

      // API returned an error
      return { success: false, error: data.error || 'Login failed' };

    } catch (error) {
      console.error('[Login] API error:', error);

      // Fallback: Check localStorage for registered users
      if (typeof window !== 'undefined') {
        const registeredUser = localStorage.getItem('tcredex_registered_user');
        if (registeredUser) {
          try {
            const userData = JSON.parse(registeredUser);
            if (userData.email === normalizedEmail && userData.password === password) {
              setCurrentDemoRole(userData.role);
              setUser(createUserFromSession(userData));
              const sessionData = { ...userData, orgRole: Role.ORG_ADMIN };
              localStorage.setItem('tcredex_session', JSON.stringify(sessionData));
              setCookie('tcredex_session', JSON.stringify(sessionData));
              return { success: true };
            }
          } catch (e) {
            console.error('Error parsing registered user data:', e);
            localStorage.removeItem('tcredex_registered_user');
          }
        }
      }

      return { success: false, error: 'Login failed. Please check your credentials.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCurrentDemoRole(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tcredex_session');
      // Delete cookie for middleware
      deleteCookie('tcredex_session');
      window.location.href = '/';
    }
  }, []);

  const switchRole = useCallback((role: 'sponsor' | 'cde' | 'investor' | 'admin') => {
    if (!user) return;
    // Role switching is deprecated - users should log in as a different user
    // Just update the displayed role without changing user data
    setCurrentDemoRole(role);
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('tcredex_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          session.role = role;
          session.userType = role;
          localStorage.setItem('tcredex_session', JSON.stringify(session));
          setCookie('tcredex_session', JSON.stringify(session));
        } catch { /* ignore */ }
      }
    }
  }, [user]);

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
    switchRole,
    currentDemoRole,
    orgType: user?.organization.type,
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
