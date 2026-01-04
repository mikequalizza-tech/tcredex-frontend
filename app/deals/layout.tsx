'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider, useCurrentUser } from '@/lib/auth';
import { ChatTC } from '@/components/chat';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

function DealsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useCurrentUser();
  
  // Routes that always require authentication
  const protectedPaths = ['/deals/new'];
  const requiresAuth = protectedPaths.some(path => pathname.startsWith(path));

  // The marketplace page (/deals) has its own complete layout with sidebar
  // Don't add Header/Footer for it
  const isMarketplacePage = pathname === '/deals';

  // Protected routes (e.g., /deals/new) - always use AppLayout with auth
  if (requiresAuth) {
    return (
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    );
  }

  // Marketplace page - use AppLayout for authenticated users
  if (isMarketplacePage) {
    if (isAuthenticated) {
      return (
        <>
          <AppLayout>{children}</AppLayout>
          <ChatTC />
        </>
      );
    }
    // Public view - show with header/footer
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Header />
        <main className="grow">
          {children}
        </main>
        <Footer />
        <ChatTC />
      </div>
    );
  }

  // For deal detail pages (/deals/[id])
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
        <ChatTC />
      </div>
    );
  }

  // Authenticated users on deal detail pages - show dashboard layout
  if (isAuthenticated) {
    return (
      <>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </>
    );
  }

  // PUBLIC VIEW - Marketing layout for logged-out users viewing deal details
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />
      <main className="grow">
        {children}
      </main>
      <Footer />
      <ChatTC />
    </div>
  );
}

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DealsLayoutContent>{children}</DealsLayoutContent>
    </AuthProvider>
  );
}
