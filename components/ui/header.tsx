"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";
import HeaderSearch from "./header-search";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function Header() {
  const [platformOpen, setPlatformOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (platformRef.current && !platformRef.current.contains(event.target as Node)) {
        setPlatformOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link href="/blog" className="text-sm text-gray-300 hover:text-white">
              Blog
            </Link>

            {/* Platform Dropdown */}
            <div className="relative" ref={platformRef}>
              <button
                onClick={() => setPlatformOpen(!platformOpen)}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                Platform
                <svg className={`w-4 h-4 transition-transform ${platformOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {platformOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                  <Link href="/map" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setPlatformOpen(false)}>
                    <div className="font-medium">Map</div>
                    <div className="text-xs text-gray-500">Census tract eligibility</div>
                  </Link>
                  <Link href="/deals" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setPlatformOpen(false)}>
                    <div className="font-medium">Marketplace</div>
                    <div className="text-xs text-gray-500">Browse tax credit deals</div>
                  </Link>
                  <Link href="/pricing" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setPlatformOpen(false)}>
                    <div className="font-medium">Pricing Coach</div>
                    <div className="text-xs text-gray-500">Get pricing guidance</div>
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white"
              >
                Resources
                <svg className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-2">
                  <Link href="/features" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">Features</div>
                    <div className="text-xs text-gray-500">Platform capabilities</div>
                  </Link>
                  <Link href="/how-it-works" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">How It Works</div>
                    <div className="text-xs text-gray-500">Step-by-step process</div>
                  </Link>
                  <Link href="/who-we-serve" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">Who We Serve</div>
                    <div className="text-xs text-gray-500">Sponsors, CDEs, Investors</div>
                  </Link>
                  <Link href="/about" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">About</div>
                    <div className="text-xs text-gray-500">Our mission and team</div>
                  </Link>
                  <Link href="/help" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => setResourcesOpen(false)}>
                    <div className="font-medium">Help</div>
                    <div className="text-xs text-gray-500">Support and documentation</div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Search + Auth buttons */}
          <div className="flex items-center gap-3">
            <HeaderSearch />

            {/* Clerk Auth Components */}
            <SignedIn>
              <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white">
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-gray-900 border border-gray-800",
                    userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-gray-800",
                    userButtonPopoverActionButtonText: "text-gray-300",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="redirect">
                <button className="text-sm text-gray-300 hover:text-white">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg">
                  Register
                </button>
              </SignUpButton>
            </SignedOut>

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
