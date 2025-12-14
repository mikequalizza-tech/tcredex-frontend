'use client';

import PageIllustration from "@/components/PageIllustration";
import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <main className="relative flex grow flex-col">
        <PageIllustration multiple />
        {children}
      </main>
    </AuthProvider>
  );
}
