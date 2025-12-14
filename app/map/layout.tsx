'use client';

import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* Map page is full-screen, no AppLayout wrapper */}
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
      <ChatTC />
    </AuthProvider>
  );
}
