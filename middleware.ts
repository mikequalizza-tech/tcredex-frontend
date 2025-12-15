import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
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
  '/features',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/deals',  // Marketplace browsing is public
];

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
  '/api/auth',      // Auth API endpoints
  '/api/geo',       // Geo lookup endpoints
  '/api/eligibility', // Eligibility checks
  '/_next',         // Next.js internals
  '/favicon',
  '/images',
  '/fonts',
  '/icons',
  '/deals/',        // Individual deal pages are public
];

// Role-based route protection
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  // Admin only routes
  '/admin': ['ORG_ADMIN'],
  '/settings/team': ['ORG_ADMIN'],
  '/settings/billing': ['ORG_ADMIN'],
  
  // Project admin and above
  '/projects/new': ['ORG_ADMIN', 'PROJECT_ADMIN'],
  '/deals/new': ['ORG_ADMIN', 'PROJECT_ADMIN'],
  
  // Member and above (most app routes)
  '/dashboard': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/projects': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/deals': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/documents': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/map': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/intake': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER'],
  '/closing': ['ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER'],
  '/settings': ['ORG_ADMIN', 'PROJECT_ADMIN'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for session cookie/token
  const session = request.cookies.get('tcredex_session')?.value;
  
  // Also check localStorage via a custom header (set by client)
  const authHeader = request.headers.get('x-tcredex-auth');

  // For now, we check if there's ANY session indicator
  // In production, you'd verify the JWT/session token
  if (!session && !authHeader) {
    // No session - redirect to signin
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // Session exists - allow through
  // Role checking happens at the component level via useCurrentUser
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
