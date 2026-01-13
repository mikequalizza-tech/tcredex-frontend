# tCredex Authentication & Role System Documentation

## Overview

The tCredex platform uses a dual-layer authentication and authorization system combining **Clerk** for user authentication and **Supabase** for user/organization data and permissions.

## Architecture

### Authentication Flow

```
1. User signs in with Clerk (OAuth, email/password)
2. Clerk provides authenticated session + userId
3. Backend looks up user in Supabase by clerk_id
4. Returns user + organization + role data
5. Frontend stores user context and org type
```

### Organization Types (Roles)

The platform has **three primary organization types**:

| OrgType | Description | Primary Actions |
|---------|-------------|-----------------|
| **SPONSOR** | Project developers seeking tax credit financing | Submit deals, find CDEs & investors |
| **CDE** | Community Development Entities with NMTC allocation | Review deals, issue LOIs, deploy allocation |
| **INVESTOR** | Tax credit buyers and capital providers | Find deals, issue commitments, invest |

Additionally, there is an **admin** type for platform administrators.

### User Roles (Within Organizations)

Within each organization, users have specific permission levels:

| Role | Permissions |
|------|-------------|
| **ORG_ADMIN** | Full access to all org resources, can invite users, manage settings |
| **PROJECT_ADMIN** | Manage documents for assigned projects |
| **MEMBER** | Can view and upload documents |
| **VIEWER** | Read-only access |

## Key Components

### 1. Auth Middleware (`lib/api/auth-middleware.ts`)

**Purpose:** Validates authentication and authorization for all API routes.

**Key Functions:**
- `requireAuth(request)` - Validates Clerk session and returns user context
- `requireOrgAdmin(request)` - Requires user to be ORG_ADMIN
- `requireSystemAdmin(request)` - Requires user to be admin org type
- `verifyOrgAccess(user, orgId)` - Validates user belongs to organization
- `verifyDealAccess(user, dealId)` - Validates user can access specific deal

**Usage in API Routes:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    // user contains: id, email, organizationId, organizationType, userRole
    
    // Apply org-based filtering
    if (user.organizationType === 'sponsor') {
      // Show only sponsor's own data
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
```

### 2. Role Configuration (`lib/roles/config.ts`)

**Purpose:** Single source of truth for role-based behavior.

**Key Exports:**
- `OrgType` - TypeScript type for organization types
- `isValidOrgType(type)` - Type guard for runtime validation
- `validateOrgType(type)` - Throws error if invalid
- `PIPELINE_STAGES` - Deal pipeline stages per org type
- `MARKETPLACE_CONFIG` - What each org type sees in marketplace
- `MAP_CONFIG` - Map view configuration per org type

### 3. Role Queries (`lib/roles/queries.ts`)

**Purpose:** Fetch data filtered by organization type.

**Key Functions:**
- `fetchMarketplaceForRole(orgType, orgId)` - Returns deals/CDEs/investors based on role
  - Sponsors see: CDEs + Investors
  - CDEs see: Deals seeking allocation
  - Investors see: Public deals
- `fetchPipelineForRole(orgType, orgId)` - Returns user's pipeline deals

### 4. React Hooks

**`useCurrentUser()` (`hooks/use-current-user.ts`):**
```typescript
const { user, clerkUser, isLoading, error, isAuthenticated } = useCurrentUser();
// user.organization.type = 'sponsor' | 'cde' | 'investor'
```

**`useRoleConfig()` (`lib/roles/hooks.ts`):**
```typescript
const { orgType, marketplace, pipelineStages, mapConfig, canAccess } = useRoleConfig();

if (canAccess('allocations')) {
  // Show allocations page (CDE only)
}
```

**`useAuth()` (`hooks/useAuth.ts`):**
```typescript
const { user, isAuthenticated, loading, error } = useAuth();
// Fetches from /api/auth/me
```

## API Routes with Role-Based Filtering

### Deals API (`/api/deals`)

**SPONSOR:**
- GET: See only their own deals
- POST: Can create new deals (ORG_ADMIN only)

**CDE:**
- GET: See assigned deals + public deals
- POST: Cannot create deals

**INVESTOR:**
- GET: See public deals + deals they're involved in
- POST: Cannot create deals

**Implementation:**
```typescript
if (user.organizationType === 'sponsor') {
  query = query.eq('sponsor_organization_id', user.organizationId);
} else if (user.organizationType === 'cde') {
  const { data: cdeRecord } = await supabase
    .from('cdes')
    .select('id')
    .eq('organization_id', user.organizationId)
    .single();
  
  if (cdeRecord) {
    query = query.or(
      `assigned_cde_id.eq.${cdeRecord.id},status.in.(available,seeking_capital,matched)`
    );
  }
}
```

### CDEs API (`/api/cdes`)

**SPONSOR/INVESTOR:**
- GET: See all active CDEs (public view)
- POST: Cannot create CDE profiles

**CDE:**
- GET: See only their own profile
- POST: Can create/update profile (ORG_ADMIN only)

### Investors API (`/api/investors`)

**SPONSOR/CDE:**
- GET: See all active investors (public view)
- POST: Cannot create investor profiles

**INVESTOR:**
- GET: See only their own profile
- POST: Can create/update profile (ORG_ADMIN only)

## Security Best Practices

### ✅ DO:
1. **Always use `requireAuth()` at the start of API routes**
2. **Filter queries by organization** - Never show data from other orgs
3. **Validate organization types** - Use `isValidOrgType()` before casting
4. **Check user role** for sensitive operations (ORG_ADMIN only)
5. **Log validation errors** for debugging

### ❌ DON'T:
1. **Never trust client-side org type** - Always get from database
2. **Don't use organization_id directly in filters** - Get entity ID first
3. **Don't skip auth middleware** - Every protected route needs it
4. **Don't expose sensitive data** in public API responses
5. **Don't mix organization IDs with entity IDs** (CDE ID, Investor ID)

## Common Issues & Solutions

### Issue: "User not found in database"

**Cause:** User authenticated with Clerk but doesn't exist in Supabase.

**Solution:** User needs to complete registration/onboarding. Frontend should redirect to `/onboarding`.

**Code:**
```typescript
const response = await fetch('/api/auth/me');
const data = await response.json();

if (data.needsRegistration) {
  router.push('/onboarding');
}
```

### Issue: "Invalid organization type"

**Cause:** Organization has invalid type in database.

**Solution:** Validate and update organization type:
```typescript
if (!isValidOrgType(org.type)) {
  console.error(`Invalid org type: ${org.type}`);
  // Update in database or contact support
}
```

### Issue: CDE/Investor can't see any deals

**Cause:** Query is using `organization_id` instead of `cde_id` or `investor_id`.

**Solution:** Look up entity ID first:
```typescript
// WRONG:
query = query.eq('assigned_cde_id', user.organizationId);

// CORRECT:
const { data: cdeRecord } = await supabase
  .from('cdes')
  .select('id')
  .eq('organization_id', user.organizationId)
  .single();

if (cdeRecord) {
  query = query.eq('assigned_cde_id', cdeRecord.id);
}
```

## Testing

### Manual Testing

1. **Create test users** for each org type:
   - sponsor@test.com (SPONSOR)
   - cde@test.com (CDE)
   - investor@test.com (INVESTOR)

2. **Test data isolation:**
   - Sponsor A should NOT see Sponsor B's deals
   - CDE should see public deals + their assigned deals
   - Investor should see public deals only

3. **Test permissions:**
   - Only ORG_ADMIN can create deals/profiles
   - Members can view but not modify
   - Viewers have read-only access

### Automated Testing

See `tests/auth-system.test.ts` for comprehensive test suite covering:
- Registration flow
- Login flow
- Session validation
- Organization filtering
- Role validation
- Error handling

## Migration Notes

### From Old Auth to Clerk

The platform migrated from custom auth to Clerk. During transition:

1. **Dual lookup:** Try `clerk_id` first, fall back to `email`
2. **Update user:** Set `clerk_id` when found by email
3. **Legacy endpoints:** `/api/auth/session` is deprecated, use `/api/auth/me`

### Backend Integration

The `.env.example` references a NestJS backend API URL, but the current implementation uses direct Supabase queries. For full backend integration:

1. **Replace Supabase queries** with API calls to NestJS backend
2. **Backend handles** authentication, authorization, and data access
3. **Frontend** becomes pure presentation layer

## Troubleshooting

### Enable Debug Logging

Add to `.env.local`:
```
NEXT_PUBLIC_DEBUG_AUTH=true
```

### Check Auth State

Visit `/api/auth/debug` to see current auth state (dev only).

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `UNAUTHENTICATED` | No valid Clerk session | User needs to sign in |
| `USER_NOT_FOUND` | No Supabase user record | Complete registration |
| `INVALID_ORG_TYPE` | Invalid organization type | Contact support |
| `FORBIDDEN` | Insufficient permissions | Check user role |

## References

- Clerk Docs: https://clerk.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Auth: https://nextjs.org/docs/authentication

---

**Last Updated:** 2026-01-13
**Version:** 1.0.0
