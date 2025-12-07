'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';

const nav = [
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/cde', label: 'CDE' },
  { href: '/investor', label: 'Investor' },
  { href: '/admin', label: 'Admin' }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 hidden sm:flex flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="px-4 py-6 border-b border-slate-800">
          <Link href="/" className="text-base font-semibold text-slate-100">
            tCredex Workspace
          </Link>
        </div>

        <nav className="flex flex-col flex-1 px-3 py-4 gap-1">
          {nav.map((item) => {
            const active =
              path === item.href || path.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 font-medium ${
                  active
                    ? 'bg-slate-800 text-sky-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-sky-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 text-xs text-slate-500">
          © tCredex
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1">
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Dashboard
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
