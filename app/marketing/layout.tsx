/// app/layout.tsx
import './css/style.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'tCredex — Impact Tax Credit Marketplace',
  description:
    'tCredex connects sponsors, CDEs, CDFIs, and investors across NMTC, LIHTC, HTC, and state tax credit deals.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} min-h-screen bg-slate-950 text-slate-50 antialiased`}
        >
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

