'use client';

import { AppLayout } from '@/components/layout';
import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';

export default function MatchingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get user role from auth session
  const userRole = 'cde' as const;
  const userName = 'Demo User';
  const userEmail = 'demo@tcredex.com';
  const orgName = 'Demo Organization';

  return (
    <AuthProvider>
      <AppLayout
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        orgName={orgName}
      >
        {children}
      </AppLayout>
      <ChatTC />
    </AuthProvider>
  );
}
