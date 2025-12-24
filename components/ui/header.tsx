"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";
import HeaderSearch from "./header-search";

interface DropdownItem {
  name: string;
  href: string;
  description?: string;
  requiresAuth?: boolean;
}

interface NavDropdown {
  name: string;
  items: DropdownItem[];
}

const platformDropdown: NavDropdown = {
  name: "Platform",
  items: [
    { name: "Map", href: "/map", description: "Interactive deal map with census tract data" },
    { name: "Marketplace", href: "/deals", description: "Browse tax credit opportunities", requiresAuth: true },
    { name: "Pricing Coach", href: "/pricing", description: "Get pricing guidance", requiresAuth: true },
  ],
};

const resourcesDropdown: NavDropdown = {
  name: "Resources",
  items: [
    { name: "Features", href: "/features", description: "Platform capabilities" },
    { name: "How It Works", href: "/how-it-works", description: "Step-by-step process" },
    { name: "Who We Serve", href: "/who-we-serve", description: "Sponsors, CDEs, and Investors" },
    { name: "About", href: "/about", description: "Our mission and team" },
    { name: "Help", href: "/help", description: "Support and documentation" },
  ],
};

function NavDropdownMenu({ dropdown, isLoggedIn }: { dropdown: NavDropdown; isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="flex items-center gap-1 transition hover:text-white py-2" style={{ color: '#d1d5db' }}>
        {dropdown.name}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          {dropdown.items.map((item) => {
            // If requires auth and not logged in, show as disabled or link to signin
            if (item.requiresAuth && !isLoggedIn) {
              return (
                <Link key={item.href} href="/signin" className="block px-4 py-3 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">{item.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Login required</span>
                  </div>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className="block px-4 py-3 hover:bg-gray-800 transition-colors">
                <span className="text-sm font-medium text-gray-200">{item.name}</span>
                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  // Hydration fix: track mount state
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLLIElement>(null);

  // Set mounted state first
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check auth state AFTER mount
  useEffect(() => {
    if (!isMounted) return;
    
    const session = localStorage.getItem('tcredex_session');
    if (session) {
      try {
        const { role } = JSON.parse(session);
        setIsLoggedIn(true);
        // Get user name based on role
        const names: Record<string, string> = {
          cde: 'Sarah Chen',
          sponsor: 'John Martinez',
          investor: 'Michael Thompson',
          admin: 'Platform Admin',
        };
        setUserName(names[role] || 'User');
      } catch {
        setIsLoggedIn(false);
      }
    }
  }, [isMounted]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tcredex_session');
    localStorage.removeItem('tcredex_demo_role');
    setIsLoggedIn(false);
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  // Render auth buttons placeholder while checking auth to prevent hydration mismatch
  const renderAuthButtons = () => {
    // Until mounted, render a placeholder with same dimensions to prevent layout shift
    if (!isMounted) {
      return (
        <li className="w-[140px]">
          {/* Placeholder to prevent layout shift */}
        </li>
      );
    }

    if (isLoggedIn) {
      return (
        <>
          {/* Dashboard link */}
          <li>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </li>
          {/* User menu */}
          <li className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userName.charAt(0)}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-medium text-gray-200">{userName}</p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors border-t border-gray-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </li>
        </>
      );
    }

    return (
      <>
        <li>
          <Link
            href="/signin"
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Login
          </Link>
        </li>
        <li>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Register
          </Link>
        </li>
      </>
    );
  };

  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-gray-900/90 px-3 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] after:absolute after:inset-0 after:-z-10 after:backdrop-blur-xs">
          {/* Site branding */}
          <div className="flex flex-1 items-center" style={{ minWidth: '160px' }}>
            <Logo size="md" />
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:grow">
            <ul className="flex grow flex-wrap items-center justify-center gap-6 text-sm">
              <li>
                <Link href="/" className="flex items-center transition hover:text-white" style={{ color: '#d1d5db' }}>Home</Link>
              </li>
              <li>
                <NavDropdownMenu dropdown={platformDropdown} isLoggedIn={isLoggedIn} />
              </li>
              <li>
                <NavDropdownMenu dropdown={resourcesDropdown} isLoggedIn={isLoggedIn} />
              </li>
              <li>
                <Link href="/blog" className="flex items-center transition hover:text-white" style={{ color: '#d1d5db' }}>Blog</Link>
              </li>
            </ul>
          </nav>

          {/* Search */}
          <div className="hidden md:block">
            <HeaderSearch />
          </div>

          {/* Desktop auth */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {renderAuthButtons()}
            <li>
              <MobileMenu />
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
