'use client';

import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/lib/auth';
import { ChatTC } from '@/components/chat';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CDELayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute allowedOrgTypes={['cde']}>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    </AuthProvider>
  );
}
