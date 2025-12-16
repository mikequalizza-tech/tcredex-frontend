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

  // Protected routes (e.g., /deals/new) - always use AppLayout with auth
  if (requiresAuth) {
    return (
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    );
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="grow flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
        <ChatTC />
      </>
    );
  }

  // Authenticated users browsing marketplace/deals - show dashboard layout
  if (isAuthenticated) {
    return (
      <>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </>
    );
  }

  // PUBLIC VIEW - Marketing layout for logged-out users
  return (
    <>
      <Header />
      <main className="grow">
        {children}
      </main>
      <Footer />
      <ChatTC />
    </>
  );
}

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DealsLayoutContent>{children}</DealsLayoutContent>
    </AuthProvider>
  );
}
