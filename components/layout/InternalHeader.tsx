'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export type UserRole = 'sponsor' | 'cde' | 'investor' | 'admin';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface InternalHeaderProps {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  breadcrumbs?: Breadcrumb[];
  showSearch?: boolean;
  onMenuToggle?: () => void;
}

// Route metadata for breadcrumb generation
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/projects': 'My Projects',
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/portfolio': 'Portfolio',
  '/dashboard/automatch': 'AutoMatch AI',
  '/dashboard/documents': 'Documents',
  '/dashboard/team': 'Team',
  '/dashboard/settings': 'Settings',
  '/map': 'Deal Map',
  '/deals': 'Marketplace',
  '/closing-room': 'Closing Room',
  '/pricing': 'Pricing Coach',
  '/automatch': 'AutoMatch',
  '/matching': 'Matching',
  '/admin': 'Admin',
  '/cde': 'CDE Portal',
  '/investor': 'Investor Portal',
};

export default function InternalHeader({
  userRole,
  userName = 'User',
  userEmail = 'user@example.com',
  orgName = 'Organization',
  breadcrumbs,
  showSearch = true,
  onMenuToggle,
}: InternalHeaderProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-generate breadcrumbs from pathname if not provided
  const autoBreadcrumbs = (): Breadcrumb[] => {
    if (breadcrumbs) return breadcrumbs;
    
    const segments = pathname?.split('/').filter(Boolean) || [];
    const crumbs: Breadcrumb[] = [{ label: 'Home', href: '/dashboard' }];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const title = ROUTE_TITLES[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      // Don't make the last segment a link
      if (index === segments.length - 1) {
        crumbs.push({ label: title });
      } else {
        crumbs.push({ label: title, href: currentPath });
      }
    });
    
    return crumbs;
  };

  const crumbs = autoBreadcrumbs();

  const roleLabels: Record<UserRole, string> = {
    sponsor: 'Sponsor',
    cde: 'CDE',
    investor: 'Investor',
    admin: 'Admin',
  };

  const roleColors: Record<UserRole, string> = {
    sponsor: 'bg-green-600',
    cde: 'bg-purple-600',
    investor: 'bg-blue-600',
    admin: 'bg-red-600',
  };

  // Demo notifications
  const notifications = [
    { id: 1, title: 'New document shared', message: 'Sarah shared "Phase I ESA" with you', time: '5 min ago', unread: true },
    { id: 2, title: 'Deal update', message: 'Eastside Grocery moved to closing', time: '1 hour ago', unread: true },
    { id: 3, title: 'AutoMatch found 3 deals', message: 'New matches available for review', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button - for sidebar toggle on mobile */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {crumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <svg className="w-4 h-4 text-gray-600 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.href ? (
                <Link href={crumb.href} className="text-gray-400 hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-200 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Search (optional) */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, documents, projects..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex px-2 py-0.5 text-xs text-gray-500 bg-gray-700 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Right: Actions & User */}
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/dashboard/documents/new"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Upload Document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </Link>
          <Link
            href="/dashboard/projects/new"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="New Project"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-100">Notifications</h3>
                <button className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      notification.unread ? 'bg-gray-700/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.unread && (
                        <span className="w-2 h-2 mt-2 bg-indigo-500 rounded-full flex-shrink-0" />
                      )}
                      <div className={notification.unread ? '' : 'ml-5'}>
                        <p className="text-sm font-medium text-gray-200">{notification.title}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/notifications"
                className="block p-3 text-center text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/50 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-700" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-200 leading-tight">{userName}</p>
              <p className="text-xs text-gray-500 leading-tight">{orgName}</p>
            </div>
            <svg className="w-4 h-4 text-gray-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 truncate">{userName}</p>
                    <p className="text-sm text-gray-400 truncate">{userEmail}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${roleColors[userRole]} text-white`}>
                      {roleLabels[userRole]}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/dashboard/team"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team
                </Link>
                {userRole === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Console
                  </Link>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-700">
                <Link
                  href="/signout"
                  className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
