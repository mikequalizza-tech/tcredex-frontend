# Authentication & Onboarding Testing Guide

This guide provides step-by-step instructions for testing the complete user registration and onboarding flow in tCredex.

## Overview

The authentication flow consists of:
1. **User Registration** - Create a new account
2. **Email Verification** - Confirm email address (optional)
3. **Login** - Authenticate existing users
4. **Onboarding** - Select role and complete profile
5. **Session Management** - Maintain user session

## Prerequisites

Before testing, ensure:
- ✅ Frontend dev server is running (`pnpm dev`)
- ✅ Supabase is configured (`.env.local` has correct values)
- ✅ Database tables exist (`users_simplified`, `organizations`, etc.)
- ✅ Email service is configured (optional for development)

## Test Scenarios

### Scenario 1: New User Registration (Sponsor)

**Goal**: Create a new sponsor account and verify the onboarding flow.

#### Steps:

1. **Navigate to Sign Up**
   ```
   Go to: http://localhost:3000/signup
   ```

2. **Fill Registration Form**
   - Email: `test-sponsor@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - First Name: `John`
   - Last Name: `Doe`
   - Organization Name: `Test Development LLC`
   - Role: Select "Project Sponsor"
   - Accept Terms: ✓

3. **Submit Form**
   - Click "Create Account"
   - Wait for processing

4. **Expected Outcome**
   - ✅ User account created in Supabase Auth
   - ✅ Organization created in `sponsors_simplified` table
   - ✅ User record created in `users_simplified` table
   - ✅ Welcome email sent (check logs)
   - ✅ Redirected to `/dashboard` or onboarding

5. **Verify in Database**
   ```sql
   -- Check user was created
   SELECT * FROM users_simplified WHERE email = 'test-sponsor@example.com';
   
   -- Check organization was created
   SELECT * FROM sponsors_simplified WHERE primary_contact_email = 'test-sponsor@example.com';
   ```

6. **Expected Data**
   - `users_simplified.role` = 'ORG_ADMIN'
   - `users_simplified.organization_type` = 'sponsor'
   - `users_simplified.is_active` = true
   - `users_simplified.email_verified` = true

### Scenario 2: New User Registration (CDE)

**Goal**: Create a new CDE account.

#### Steps:

1. Navigate to: `http://localhost:3000/signup`

2. Fill form with:
   - Email: `test-cde@example.com`
   - Password: `TestPassword123!`
   - Organization Name: `Midwest Community Development`
   - Role: Select "CDE / Allocatee"

3. Submit and verify similar to Scenario 1

4. **Expected Data**
   - `users_simplified.organization_type` = 'cde'
   - Organization created in appropriate table

### Scenario 3: New User Registration (Investor)

**Goal**: Create a new investor account.

#### Steps:

1. Navigate to: `http://localhost:3000/signup`

2. Fill form with:
   - Email: `test-investor@example.com`
   - Password: `TestPassword123!`
   - Organization Name: `Great Lakes Capital`
   - Role: Select "Investor"

3. Submit and verify

4. **Expected Data**
   - `users_simplified.organization_type` = 'investor'
   - Organization created in `investors_simplified`

### Scenario 4: User Login

**Goal**: Test existing user login and session creation.

#### Steps:

1. **Navigate to Sign In**
   ```
   Go to: http://localhost:3000/signin
   ```

2. **Enter Credentials**
   - Email: `test-sponsor@example.com`
   - Password: `TestPassword123!`

3. **Submit Form**
   - Click "Sign In"

4. **Expected Outcome**
   - ✅ Supabase auth session created
   - ✅ User data fetched from `users_simplified`
   - ✅ Organization data fetched
   - ✅ Session cookies set (`auth-token`, `tcredex_session`)
   - ✅ Redirected to `/dashboard`
   - ✅ Last login timestamp updated

5. **Verify Session Cookies**
   - Open browser DevTools → Application → Cookies
   - Check for `auth-token` cookie
   - Check for `tcredex_session` cookie
   - Verify `httpOnly: true` and `secure: false` (dev)

6. **Verify in Database**
   ```sql
   SELECT last_login_at FROM users_simplified 
   WHERE email = 'test-sponsor@example.com';
   ```
   - `last_login_at` should be updated to current timestamp

### Scenario 5: Protected Route Access

**Goal**: Verify middleware protects authenticated routes.

#### Steps:

1. **Without Login**
   ```
   Go to: http://localhost:3000/dashboard
   ```
   - Should redirect to `/signin`

2. **After Login**
   ```
   Sign in, then go to: http://localhost:3000/dashboard
   ```
   - Should display dashboard
   - User info should be visible

3. **Test Other Protected Routes**
   - `/messages` - Should be accessible
   - `/closing-room` - Should be accessible
   - `/deals/new` - Should check onboarding status

### Scenario 6: Onboarding Flow

**Goal**: Test the onboarding completion flow.

#### Steps:

1. **Trigger Onboarding**
   - Create a new user without completing onboarding
   - Navigate to: `http://localhost:3000/deals/new`

2. **Expected Behavior**
   - If `organization_id` is null → redirect to `/onboarding`
   - If role not set → redirect to `/onboarding`

3. **Complete Onboarding**
   - Select role type
   - Fill organization details
   - Submit

4. **Verify Completion**
   - `tcredex_onboarded` cookie should be set
   - User should have `organization_id`
   - User should have `role_type`

### Scenario 7: Logout

**Goal**: Test session termination.

#### Steps:

1. **Navigate to Logout**
   ```
   Go to: http://localhost:3000/signout
   or
   Go to: http://localhost:3000/api/auth/logout
   ```

2. **Expected Outcome**
   - ✅ Session cookies cleared
   - ✅ Supabase session terminated
   - ✅ Redirected to `/signin`

3. **Verify**
   - Try accessing `/dashboard` → Should redirect to signin
   - Check cookies are cleared

### Scenario 8: Demo Login

**Goal**: Test demo account login (development only).

#### Steps:

1. **Access Demo Login API**
   ```bash
   curl -X POST http://localhost:3000/api/auth/demo-login \
     -H "Content-Type: application/json" \
     -d '{"role": "sponsor"}'
   ```

2. **Expected Response**
   ```json
   {
     "success": true,
     "user": {
       "id": "...",
       "email": "sarah@midwestcde.com",
       "role": "ORG_ADMIN",
       ...
     }
   }
   ```

3. **Available Demo Roles**
   - `sponsor` → `sarah@midwestcde.com`
   - `investor` → `michael@greatlakes.bank`
   - `cde` → `john@eastsidefood.org`
   - `admin` → `admin@tcredex.com`

## Common Issues & Solutions

### Issue 1: "Email already exists"

**Symptom**: Registration fails with email already exists error

**Solutions**:
1. Use a different email
2. Delete the existing user from Supabase Auth dashboard
3. Clear the `users_simplified` table for testing

```sql
DELETE FROM users_simplified WHERE email = 'test@example.com';
```

### Issue 2: "Failed to create user record"

**Symptom**: Auth user created but database insert fails

**Causes**:
- Missing database tables
- RLS policies blocking insert
- Null constraint violations

**Solutions**:
1. Verify tables exist: `users_simplified`, `organizations`, `sponsors_simplified`
2. Check RLS policies allow service role inserts
3. Review error logs for specific constraint violation

### Issue 3: Login Successful but No Dashboard Access

**Symptom**: User logs in but dashboard shows no data

**Causes**:
- `organization_id` is null
- User role not properly set
- RLS policies blocking data access

**Solutions**:
1. Check `users_simplified` record has `organization_id`
2. Verify `role` is set correctly
3. Complete onboarding flow

### Issue 4: Cookies Not Being Set

**Symptom**: Session cookies not appearing in browser

**Causes**:
- `httpOnly` flag preventing client access
- `sameSite` or `secure` flag mismatch
- Browser blocking third-party cookies

**Solutions**:
1. Check browser DevTools → Application → Cookies
2. Verify domain matches (`localhost`)
3. Ensure development mode uses `secure: false`

### Issue 5: Email Confirmation Not Working

**Symptom**: Confirmation email not sent or link not working

**Causes**:
- Resend API key not configured
- Email service error
- Redirect URL mismatch

**Solutions**:
1. Check `RESEND_API_KEY` in `.env.local`
2. Review email service logs
3. Verify `emailRedirectTo` URL is correct

## Manual Testing Checklist

Use this checklist to verify the complete flow:

### Registration Flow
- [ ] Can access `/signup` page
- [ ] Form validation works (required fields, password match)
- [ ] Can select role (sponsor/cde/investor)
- [ ] Terms checkbox is required
- [ ] Submit creates Supabase Auth user
- [ ] Submit creates organization record
- [ ] Submit creates user_simplified record
- [ ] Success message or redirect appears
- [ ] Welcome email sent (optional)

### Login Flow
- [ ] Can access `/signin` page
- [ ] Invalid credentials show error
- [ ] Valid credentials log in successfully
- [ ] Session cookies are set
- [ ] User data loads correctly
- [ ] Redirect to dashboard works
- [ ] Last login timestamp updates

### Authorization Flow
- [ ] Unauthenticated users redirected to signin
- [ ] Authenticated users can access dashboard
- [ ] Protected routes check authentication
- [ ] Onboarding check works
- [ ] Role-based access works (if implemented)

### Session Management
- [ ] Session persists on page refresh
- [ ] Logout clears session
- [ ] Expired sessions redirect to signin
- [ ] Session timeout works (24 hours)

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Validation errors are clear
- [ ] Server errors don't expose sensitive info
- [ ] Form retains data on error

## Automated Testing

For automated testing, consider:

```typescript
// Example using Playwright or Cypress
describe('User Registration', () => {
  it('should register a new sponsor', async () => {
    await page.goto('http://localhost:3000/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="organizationName"]', 'Test Org');
    await page.click('[data-role="sponsor"]');
    await page.check('[name="acceptTerms"]');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Security Testing

Test these security aspects:

- [ ] Passwords are hashed (not visible in database)
- [ ] Session tokens are httpOnly
- [ ] CSRF protection is enabled
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] Rate limiting works (if implemented)
- [ ] Email verification prevents unauthorized access (if required)

## Next Steps

After completing these tests:

1. Document any issues found
2. Fix critical bugs
3. Implement missing features
4. Add automated tests
5. Deploy to staging for further testing
6. Perform load testing
7. Security audit

## Getting Help

If tests fail:

1. Check browser console for errors
2. Check server logs for backend errors
3. Verify database state
4. Review [Environment Setup](./ENVIRONMENT_SETUP.md)
5. Review [Backend Integration](./BACKEND_INTEGRATION.md)
