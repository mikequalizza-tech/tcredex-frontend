import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// QR/Referral Campaign Destinations
// ============================================================================
const CAMPAIGN_DESTINATIONS: Record<string, string> = {
  // Conference/Event QR codes
  'conf-2025': '/founders?utm_source=conference&utm_campaign=2025',
  'nmtc-conf': '/founders?utm_source=nmtc-conference',
  'htc-conf': '/founders?utm_source=htc-conference',
  
  // Marketing materials
  'pitch-deck': '/founders?utm_source=pitch-deck',
  'business-card': '/founders?utm_source=business-card',
  'one-pager': '/founders?utm_source=one-pager',
  'brochure': '/founders?utm_source=brochure',
  
  // Social/Digital
  'linkedin': '/founders?utm_source=linkedin',
  'twitter': '/founders?utm_source=twitter',
  'email-sig': '/founders?utm_source=email-signature',
  
  // Partner codes
  'cde-partner': '/founders?utm_source=cde-partner',
  'investor-intro': '/founders?utm_source=investor-intro',
  
  // Demo/testing - these now require signin
  'demo': '/signin?redirect=/map',
  'test': '/founders?utm_source=test',
};

// ============================================================================
// Public Routes Configuration
// ============================================================================
const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup', 
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/pricing',
  '/contact',
  '/contact-aiv',
  '/support',
  '/features',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/founders', // Pre-launch signup page
  '/blog',
  '/help',
  '/who-we-serve',
  // NOTE: /map and /intake are PROTECTED - require login
];

const PUBLIC_PREFIXES = [
  '/api/auth/',        // Auth APIs are public
  '/api/register',     // Registration API
  '/api/contact',      // Contact form API
  '/api/eligibility',  // Census tract eligibility lookup
  '/api/geo/',         // Geo/tract resolution APIs
  '/api/tracts/',      // Tract data APIs
  '/api/map/',         // Map tracts API - Source of Truth map
  '/api/tiles/',       // <--- ADD THIS LINE (Public Map Tiles)
  '/api/pricing',      // Pricing calculator
  '/api/founders/',    // Founders registration
  '/api/deals',        // Marketplace deals - public read
  '/api/cdes',         // CDE directory - public read
  '/api/investors',    // Investor directory - public read
  '/_next',
  '/favicon',
  '/images',
  '/fonts',
  '/icons',
  '/blog/',
  '/r/',               // QR/referral redirects
];

// Protected route prefixes that always need auth
const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/map',
  '/intake',
  '/cde',
  '/investor',
  '/deals',
  '/documents',
  '/closing-room',
  '/settings',
  '/profile',
];

// ============================================================================
// Middleware Handler
// ============================================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce HTTPS in production
  const proto = request.headers.get('x-forwarded-proto');
  const isHttps = proto === 'https' || request.nextUrl.protocol === 'https:';
  if (process.env.NODE_ENV === 'production' && !isHttps) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl);
  }

  // -------------------------------------------------------------------------
  // QR Code / Referral Link Handler
  // Intercepts /r/[code] paths and redirects with tracking
  // -------------------------------------------------------------------------
  if (pathname.startsWith('/r/')) {
    const code = pathname.replace('/r/', '').split('/')[0];
    
    if (code) {
      // Determine destination
      let destination: string;
      const codeUpper = code.toUpperCase();
      const codeLower = code.toLowerCase();
      
      if (codeUpper.startsWith('FM-')) {
        // Referral code - go to founders page with referral param
        destination = `/founders?ref=${codeUpper}`;
      } else if (CAMPAIGN_DESTINATIONS[codeLower]) {
        // Known campaign code
        destination = CAMPAIGN_DESTINATIONS[codeLower];
      } else {
        // Unknown code - default to founders page with code as UTM
        destination = `/founders?utm_source=qr&utm_campaign=${code}`;
      }

      // Create redirect response
      const redirectUrl = new URL(destination, request.url);
      const response = NextResponse.redirect(redirectUrl);
      
      // Set tracking cookie for conversion attribution
      response.cookies.set('tcredex_track', JSON.stringify({
        code: codeUpper,
        type: codeUpper.startsWith('FM-') ? 'referral' : 'campaign',
        timestamp: Date.now(),
        device: /mobile|android|iphone|ipad/i.test(request.headers.get('user-agent') || '') ? 'mobile' : 'desktop'
      }), {
        httpOnly: false, // Allow JS to read for conversion tracking
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days attribution window
      });

      return response;
    }
  }

  // -------------------------------------------------------------------------
  // Standard Auth Middleware
  // -------------------------------------------------------------------------
  
  // Allow static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public routes (exact match)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  // Get session
  const sessionToken = request.cookies.get('tcredex_session')?.value;
  const sessionRole = request.cookies.get('tcredex_role')?.value;
  const authHeader = request.headers.get('x-tcredex-auth');

  if (!sessionToken && !authHeader) {
    // No session - redirect to signin for protected routes
    if (isProtectedRoute) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
    
    // For other non-public routes, also redirect
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Validate session for admin routes
  if (pathname.startsWith('/admin')) {
    if (sessionRole !== 'admin') {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
