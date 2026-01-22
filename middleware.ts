
const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/support',
  '/blog',
  '/help',
  '/programs',
  '/r/',
  '/api/auth',
  '/api/register',
  '/api/contact',
  '/api/chat',  // ChatTC API
  '/api/eligibility',
  '/api/geo',
  '/api/tracts',
  '/api/map',
  '/api/tiles',
  '/api/pricing',
  '/api/founders',
  '/api/deals',
  '/api/deals/(.*)',
  '/api/cdes',
  '/api/investors',
  '/api/webhook',
  '/api/webhook/(.*)',
  '/api/onboarding',
  '/api/closing-room',  // Allow closing room API
];
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/about',
  '/pricing',
  '/contact',
  '/contact-aiv',
  '/features',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/founders',
  '/who-we-serve',
  '/programs(.*)',
  '/r/(.*)',  // QR/referral redirects
  '/onboarding',
  '/map',  // Map is public (shows marketplace map)
  '/deals',  // Marketplace is public
  '/deals/(.*)',  // Individual deal pages
  '/faq',
  '/newsletter',
  '/api/auth/(.*)',
];


function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

// ============================================================================
// Supabase Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static files, Next.js internals, and public assets from auth middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(css|js|mjs|json|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$/)
  ) {
    return NextResponse.next();
  }

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

// (removed duplicate/legacy merge conflict block)
  // Create Supabase client for auth check
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes - allow through
  if (isPublicRoute(pathname)) {
    return response;
  }
  // Protected routes - redirect to signin if not authenticated
  if (!user) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Check if user needs onboarding for protected routes
  const protectedRoutesRequiringOnboarding = [
    '/dashboard',
    '/deals/new',
    '/intake',
    '/closing-room',
    '/messages',
  ];

  const needsOnboardingCheck = protectedRoutesRequiringOnboarding.some(
    route => pathname.startsWith(route)
  );

  if (needsOnboardingCheck) {
    const onboardingComplete = request.cookies.get('tcredex_onboarded')?.value;

    if (!onboardingComplete) {
      // Check database for onboarding status
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id, role_type')
        .eq('id', user.id)
        .single();

      if (!userProfile?.organization_id || !userProfile?.role_type) {
        const onboardingUrl = new URL('/onboarding', request.url);
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return response;
}
