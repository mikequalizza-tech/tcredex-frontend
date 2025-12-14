'use client';

import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/lib/auth';
import { ChatTC } from '@/components/chat';

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppLayout>
        {children}
      </AppLayout>
      <ChatTC />
    </AuthProvider>
  );
}
