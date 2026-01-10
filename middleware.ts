import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ============================================================================
// QR/Referral Campaign Destinations
// ============================================================================
const CAMPAIGN_DESTINATIONS: Record<string, string> = {
  'conf-2025': '/founders?utm_source=conference&utm_campaign=2025',
  'nmtc-conf': '/founders?utm_source=nmtc-conference',
  'htc-conf': '/founders?utm_source=htc-conference',
  'pitch-deck': '/founders?utm_source=pitch-deck',
  'business-card': '/founders?utm_source=business-card',
  'one-pager': '/founders?utm_source=one-pager',
  'brochure': '/founders?utm_source=brochure',
  'linkedin': '/founders?utm_source=linkedin',
  'twitter': '/founders?utm_source=twitter',
  'email-sig': '/founders?utm_source=email-signature',
  'cde-partner': '/founders?utm_source=cde-partner',
  'investor-intro': '/founders?utm_source=investor-intro',
  'demo': '/signin?redirect=/map',
  'test': '/founders?utm_source=test',
};

// ============================================================================
// Public Routes - These don't require authentication
// ============================================================================
const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)',
  '/signup(.*)',
  '/sso-callback(.*)',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/pricing',
  '/contact',
  '/contact-aiv',
  '/support(.*)',
  '/features',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/founders',
  '/blog(.*)',
  '/help(.*)',
  '/who-we-serve',
  '/programs(.*)',
  '/r/(.*)',  // QR/referral redirects
  '/onboarding', // Allow access to onboarding
  '/api/auth/(.*)',
  '/api/register',
  '/api/contact',
  '/api/eligibility',
  '/api/geo/(.*)',
  '/api/tracts/(.*)',
  '/api/map/(.*)',
  '/api/tiles/(.*)',
  '/api/pricing',
  '/api/founders/(.*)',
  '/api/deals',
  '/api/cdes',
  '/api/investors',
  '/api/webhook/(.*)',
  '/api/onboarding', // Allow access to onboarding API
]);

// Routes that require onboarding to be complete
const requiresOnboarding = createRouteMatcher([
  '/dashboard(.*)',
  '/deals/new',
  '/intake(.*)',
  '/closing-room(.*)',
  '/messages(.*)',
]);

// ============================================================================
// Clerk Middleware
// ============================================================================
export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Handle QR/Referral redirects
  if (pathname.startsWith('/r/')) {
    const code = pathname.replace('/r/', '').split('/')[0];

    if (code) {
      let destination: string;
      const codeUpper = code.toUpperCase();
      const codeLower = code.toLowerCase();

      if (codeUpper.startsWith('FM-')) {
        destination = `/founders?ref=${codeUpper}`;
      } else if (CAMPAIGN_DESTINATIONS[codeLower]) {
        destination = CAMPAIGN_DESTINATIONS[codeLower];
      } else {
        destination = `/founders?utm_source=qr&utm_campaign=${code}`;
      }

      const redirectUrl = new URL(destination, request.url);
      const response = NextResponse.redirect(redirectUrl);

      response.cookies.set('tcredex_track', JSON.stringify({
        code: codeUpper,
        type: codeUpper.startsWith('FM-') ? 'referral' : 'campaign',
        timestamp: Date.now(),
        device: /mobile|android|iphone|ipad/i.test(request.headers.get('user-agent') || '') ? 'mobile' : 'desktop'
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });

      return response;
    }
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Check if authenticated user needs onboarding
  const { userId } = await auth();
  if (userId && requiresOnboarding(request)) {
    // Check onboarding status via cookie (set after onboarding complete)
    const onboardingComplete = request.cookies.get('tcredex_onboarded')?.value;

    if (!onboardingComplete) {
      // Check with API if user is onboarded
      try {
        const baseUrl = request.nextUrl.origin;
        const checkResponse = await fetch(`${baseUrl}/api/onboarding`, {
          headers: {
            Cookie: request.headers.get('cookie') || '',
          },
        });

        if (checkResponse.ok) {
          const { needsOnboarding } = await checkResponse.json();

          if (needsOnboarding) {
            const onboardingUrl = new URL('/onboarding', request.url);
            return NextResponse.redirect(onboardingUrl);
          }
        }
      } catch (error) {
        // If check fails, allow through (will be caught by page-level checks)
        console.error('[Middleware] Onboarding check failed:', error);
      }
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
