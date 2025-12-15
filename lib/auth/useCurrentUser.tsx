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

// Demo users for different roles
const DEMO_USERS: Record<string, User> = {
  cde: {
    id: 'u1', email: 'sarah@midwestcde.com', name: 'Sarah Chen', role: Role.ORG_ADMIN,
    organizationId: 'org1',
    organization: { id: 'org1', name: 'Midwest Community CDE', slug: 'midwest-cde', type: 'cde' },
    projectAssignments: [
      { projectId: 'P001', projectName: 'Eastside Grocery Co-Op', role: 'admin' },
      { projectId: 'P002', projectName: 'Northgate Health Center', role: 'admin' },
    ],
    createdAt: '2024-01-15T09:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  sponsor: {
    id: 'u2', email: 'john@eastsidefood.org', name: 'John Martinez', role: Role.ORG_ADMIN,
    organizationId: 'org2',
    organization: { id: 'org2', name: 'Eastside Food Collective', slug: 'eastside-food', type: 'sponsor' },
    projectAssignments: [{ projectId: 'P001', projectName: 'Eastside Grocery Co-Op', role: 'admin' }],
    createdAt: '2024-03-10T09:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  investor: {
    id: 'u3', email: 'michael@greatlakes.bank', name: 'Michael Thompson', role: Role.ORG_ADMIN,
    organizationId: 'org3',
    organization: { id: 'org3', name: 'Great Lakes Bank', slug: 'greatlakes-bank', type: 'investor' },
    projectAssignments: [{ projectId: 'P001', projectName: 'Eastside Grocery Co-Op', role: 'viewer' }],
    createdAt: '2024-02-20T09:00:00Z', lastLoginAt: new Date().toISOString(),
  },
  admin: {
    id: 'u4', email: 'admin@tcredex.com', name: 'Platform Admin', role: Role.ORG_ADMIN,
    organizationId: 'org0',
    organization: { id: 'org0', name: 'tCredex Platform', slug: 'tcredex', type: 'cde' },
    projectAssignments: [],
    createdAt: '2023-01-01T09:00:00Z', lastLoginAt: new Date().toISOString(),
  },
};

// Demo credentials
const DEMO_CREDENTIALS: Record<string, { password: string; role: string }> = {
  'sarah@midwestcde.com': { password: 'demo123', role: 'cde' },
  'john@eastsidefood.org': { password: 'demo123', role: 'sponsor' },
  'michael@greatlakes.bank': { password: 'demo123', role: 'investor' },
  'admin@tcredex.com': { password: 'admin123', role: 'admin' },
};

export interface ExtendedAuthContext extends AuthContext {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'sponsor' | 'cde' | 'investor' | 'admin') => void;
  currentDemoRole: 'sponsor' | 'cde' | 'investor' | 'admin' | null;
  orgType: 'cde' | 'sponsor' | 'investor' | undefined;
  orgName: string;
  orgLogo?: string;
  userName: string;
  userEmail: string;
}

const AuthContextValue = createContext<ExtendedAuthContext | undefined>(undefined);

function createUserFromSession(session: any): User {
  // Check if this is a registered user (has name/orgName) vs demo login
  const isRegisteredUser = session.name && session.orgName;
  
  // If it's a demo user login (no custom name), return demo user
  if (!isRegisteredUser && DEMO_USERS[session.role]) {
    return DEMO_USERS[session.role];
  }

  // Create user from registered session data
  return {
    id: 'u-' + Date.now(),
    email: session.email,
    name: session.name || 'User',
    role: Role.ORG_ADMIN,
    organizationId: 'org-custom',
    organization: {
      id: 'org-custom',
      name: session.orgName || 'My Organization',
      slug: session.orgName?.toLowerCase().replace(/\s+/g, '-') || 'my-org',
      type: session.role as 'sponsor' | 'cde' | 'investor',
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
    
    // Check demo credentials first
    const demoCred = DEMO_CREDENTIALS[normalizedEmail];
    if (demoCred && demoCred.password === password) {
      const role = demoCred.role as 'sponsor' | 'cde' | 'investor' | 'admin';
      const demoUser = DEMO_USERS[role];
      setCurrentDemoRole(role);
      setUser(demoUser);
      
      if (typeof window !== 'undefined') {
        const sessionData = { 
          role, 
          email: normalizedEmail,
          orgRole: demoUser.role // ORG_ADMIN, PROJECT_ADMIN, etc.
        };
        localStorage.setItem('tcredex_session', JSON.stringify(sessionData));
        // Set cookie for middleware
        setCookie('tcredex_session', JSON.stringify(sessionData));
      }
      return { success: true };
    }

    // Check registered user
    if (typeof window !== 'undefined') {
      const registeredUser = localStorage.getItem('tcredex_registered_user');
      if (registeredUser) {
        const userData = JSON.parse(registeredUser);
        if (userData.email === normalizedEmail && userData.password === password) {
          setCurrentDemoRole(userData.role);
          setUser(createUserFromSession(userData));
          const sessionData = { ...userData, orgRole: Role.ORG_ADMIN };
          localStorage.setItem('tcredex_session', JSON.stringify(sessionData));
          // Set cookie for middleware
          setCookie('tcredex_session', JSON.stringify(sessionData));
          return { success: true };
        }
      }
    }

    // Check if email exists but wrong password
    if (demoCred) {
      return { success: false, error: 'Invalid password' };
    }
    
    return { success: false, error: 'No account found with this email. Please register first.' };
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
    const demoUser = DEMO_USERS[role];
    setCurrentDemoRole(role);
    setUser(demoUser);
    if (typeof window !== 'undefined') {
      const sessionData = { 
        role, 
        email: demoUser.email,
        orgRole: demoUser.role 
      };
      localStorage.setItem('tcredex_session', JSON.stringify(sessionData));
      setCookie('tcredex_session', JSON.stringify(sessionData));
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
