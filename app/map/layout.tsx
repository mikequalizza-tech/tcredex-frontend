'use client';

import { AuthProvider, useCurrentUser } from '@/lib/auth';
import AppLayout from '@/components/layout/AppLayout';
import ChatTC from '@/components/chat/ChatTC';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

function MapLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useCurrentUser();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated users - show with AppLayout sidebar
  if (isAuthenticated) {
    return (
      <>
        <AppLayout showRoleSwitcher={true}>
          {/* Map content fills the main area */}
          <div className="h-full w-full">
            {children}
          </div>
        </AppLayout>
        <ChatTC />
      </>
    );
  }

  // Public users - marketing header/footer (map is public for eligibility checks)
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

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MapLayoutContent>{children}</MapLayoutContent>
    </AuthProvider>
  );
}
