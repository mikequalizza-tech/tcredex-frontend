'use client';

import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {/* Map page is full-screen, no AppLayout wrapper */}
        <div className="h-screen w-screen overflow-hidden">
          {children}
        </div>
        <ChatTC />
      </ProtectedRoute>
    </AuthProvider>
  );
}
