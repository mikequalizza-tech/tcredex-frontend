'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { AuthProvider, useCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@/lib/auth/types';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Deals', href: '/admin/deals', icon: '📋' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'CDEs', href: '/admin/cdes', icon: '🏛️' },
  { name: 'Investors', href: '/admin/investors', icon: '💰' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to signin
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/brand/tcredex_transparent_512x128.png" 
              alt="tCredex" 
              width={120} 
              height={30}
              className="h-7 w-auto"
            />
            <span className="font-bold text-gray-100">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">Platform Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@tcredex.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminContent>{children}</AdminContent>
    </AuthProvider>
  );
}
