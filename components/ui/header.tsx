"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = localStorage.getItem('tcredex_session');
    const demoRole = localStorage.getItem('tcredex_demo_role');
    if (session || demoRole) {
      setIsLoggedIn(true);
      const storedName = localStorage.getItem('tcredex_user_name');
      if (storedName) setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
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

  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-gray-900/90 px-3 border border-gray-800">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              Home
            </Link>
            <Link href="/map" className="text-sm text-gray-300 hover:text-white">
              Map
            </Link>
            <Link href="/deals" className="text-sm text-gray-300 hover:text-white">
              Marketplace
            </Link>
            <Link href="/pricing" className="text-sm text-gray-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/features" className="text-sm text-gray-300 hover:text-white">
              Features
            </Link>
            <Link href="/how-it-works" className="text-sm text-gray-300 hover:text-white">
              How It Works
            </Link>
            <Link href="/about" className="text-sm text-gray-300 hover:text-white">
              About
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Dashboard
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-800 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {userName.charAt(0)}
                    </div>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm font-medium text-gray-200">{userName}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 border-t border-gray-800"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg"
                >
                  Register
                </Link>
              </>
            )}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
