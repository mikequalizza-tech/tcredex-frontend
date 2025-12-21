'use client';

import { AuthProvider } from '@/lib/auth';

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
