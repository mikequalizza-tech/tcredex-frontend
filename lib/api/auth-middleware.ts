/**
 * Authentication Middleware
 * Provides utilities for validating authentication and authorization on API routes
 *
 * CRITICAL: This is the single source of truth for auth validation
 * All API endpoints MUST use requireAuth() before accessing data
 *
 * Uses Clerk for authentication, Supabase for user/organization data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authenticated user context
 * This is what every API endpoint receives after requireAuth()
 */
export interface AuthUser {
  id: string;
  email: string;
  organizationId: string;
  organizationType: 'sponsor' | 'cde' | 'investor' | 'admin';
  userRole: 'ORG_ADMIN' | 'PROJECT_ADMIN' | 'MEMBER' | 'VIEWER';
  clerkUserId: string;
}

/**
 * Validate authentication and return user context
 * CRITICAL: Call this at the start of every API endpoint
 * Throws AuthError if not authenticated or user not found
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  try {
    // Get Clerk auth session
    const { userId } = await auth();

    if (!userId) {
      throw new AuthError('UNAUTHENTICATED', 'Not authenticated', 401);
    }

    const supabase = getSupabaseAdmin();

    // Get user record from database using Clerk ID
    // First try clerk_id, then fall back to id (for transition period)
    let userRecord;
    let userError;

    // Try finding by clerk_id first
    const clerkResult = await supabase
      .from('users')
      .select('id, email, role, organization_id')
      .eq('clerk_id', userId)
      .single();

    if (clerkResult.data) {
      userRecord = clerkResult.data;
    } else {
      // User not found by clerk_id - they need to complete registration
      throw new AuthError(
        'USER_NOT_FOUND',
        'User not found in database. Please complete registration.',
        401
      );
    }

    const typedUserRecord = userRecord as {
      id: string
      email: string
      role: string
      organization_id: string
    };

    // Verify organization exists and is active
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, type')
      .eq('id', typedUserRecord.organization_id)
      .single();

    if (orgError || !org) {
      throw new AuthError('ORG_NOT_FOUND', 'User organization not found', 403);
    }

    const typedOrg = org as { id: string; type: string };

    // Validate organization type is valid (including admin)
    // Import isValidAllOrgType from lib/roles to validate against all types including admin
    const { isValidAllOrgType } = await import('@/lib/roles');
    
    if (!isValidAllOrgType(typedOrg.type)) {
      console.error(`[Auth] Invalid organization type: ${typedOrg.type} for user ${userId}`);
      throw new AuthError('INVALID_ORG_TYPE', 'Organization has invalid type', 403);
    }

    // Validate user role is valid
    const validUserRoles = ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'] as const;
    type ValidUserRole = typeof validUserRoles[number];
    
    if (!validUserRoles.includes(typedUserRecord.role as ValidUserRole)) {
      console.error(`[Auth] Invalid user role: ${typedUserRecord.role} for user ${userId}`);
      throw new AuthError('INVALID_USER_ROLE', 'User has invalid role', 403);
    }

    return {
      id: typedUserRecord.id,
      email: typedUserRecord.email,
      organizationId: typedUserRecord.organization_id,
      organizationType: typedOrg.type as 'sponsor' | 'cde' | 'investor' | 'admin',
      userRole: typedUserRecord.role as 'ORG_ADMIN' | 'PROJECT_ADMIN' | 'MEMBER' | 'VIEWER',
      clerkUserId: userId,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error('[Auth] Unexpected error:', error);
    throw new AuthError('AUTH_ERROR', 'Authentication failed', 500);
  }
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 * Use for endpoints that work for both authenticated and anonymous users
 */
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Require user to be organization admin
 * Use for endpoints that modify org data
 */
export async function requireOrgAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.userRole !== 'ORG_ADMIN') {
    throw new AuthError('FORBIDDEN', 'Only organization admins can perform this action', 403);
  }

  return user;
}

/**
 * Require user to be system admin
 * Use for system-wide operations
 */
export async function requireSystemAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.organizationType !== 'admin') {
    throw new AuthError('FORBIDDEN', 'Only system admins can perform this action', 403);
  }

  return user;
}

/**
 * Verify user belongs to organization
 * Use to validate org access before returning org data
 */
export function verifyOrgAccess(user: AuthUser, targetOrgId: string): void {
  if (user.organizationId !== targetOrgId && user.organizationType !== 'admin') {
    throw new AuthError('FORBIDDEN', 'You do not have access to this organization', 403);
  }
}

/**
 * Verify user can access deal
 * Checks if user's org is sponsor, assigned CDE, or investor with commitment
 */
export async function verifyDealAccess(
  request: NextRequest,
  user: AuthUser,
  dealId: string,
  requiredAccess: 'view' | 'edit' = 'view'
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: deal, error } = await supabase
    .from('deals')
    .select('sponsor_organization_id, assigned_cde_id, status')
    .eq('id', dealId)
    .single();

  if (error || !deal) {
    throw new AuthError('NOT_FOUND', 'Deal not found', 404);
  }

  const typedDeal = deal as {
    sponsor_organization_id: string
    assigned_cde_id: string | null
    status: string
  };

  // System admin can access everything
  if (user.organizationType === 'admin') {
    return;
  }

  // Sponsor can access their own deals
  if (user.organizationType === 'sponsor' && typedDeal.sponsor_organization_id === user.organizationId) {
    return;
  }

  // CDE can access assigned deals
  if (user.organizationType === 'cde' && typedDeal.assigned_cde_id) {
    const { data: cde } = await supabase
      .from('cdes')
      .select('organization_id')
      .eq('id', typedDeal.assigned_cde_id)
      .single();

    if (cde && (cde as { organization_id: string }).organization_id === user.organizationId) {
      return;
    }
  }

  // For view access, allow CDEs and investors to see public deals
  if (requiredAccess === 'view' && ['available', 'seeking_capital', 'matched'].includes(typedDeal.status)) {
    return;
  }

  throw new AuthError('FORBIDDEN', 'You do not have access to this deal', 403);
}

/**
 * Handle auth errors and return appropriate response
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error('[Auth] Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Wrap API route handler with auth error handling
 */
export function withAuthErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}

// Legacy function for backwards compatibility
export function getTokenFromRequest(request: NextRequest): string | null {
  // With Clerk, we don't need to extract tokens manually
  // Clerk middleware handles this automatically
  return null;
}
