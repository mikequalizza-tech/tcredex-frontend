"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobileNav = useRef<HTMLDivElement>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }): void => {
      if (!mobileNav.current || !trigger.current) return;
      if (
        !mobileNavOpen ||
        mobileNav.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setMobileNavOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }): void => {
      if (!mobileNavOpen || keyCode !== 27) return;
      setMobileNavOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        ref={trigger}
        className={`hamburger ${mobileNavOpen && "active"}`}
        aria-controls="mobile-nav"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
      >
        <span className="sr-only">Menu</span>
        <svg
          className="h-6 w-6 fill-current text-gray-300 transition duration-150 ease-in-out"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect y="4" width="24" height="2" rx="1" />
          <rect y="11" width="24" height="2" rx="1" />
          <rect y="18" width="24" height="2" rx="1" />
        </svg>
      </button>

      {/* Mobile navigation */}
      <nav
        id="mobile-nav"
        ref={mobileNav}
        className={`absolute left-0 top-full z-20 w-full overflow-hidden transition-all duration-300 ease-in-out ${
          mobileNavOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="rounded-2xl bg-gray-900/90 px-4 py-2 backdrop-blur-sm">
          <li>
            <Link
              href="/"
              className="flex py-2 text-gray-300 transition hover:text-white"
              onClick={() => setMobileNavOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/how-it-works"
              className="flex py-2 text-gray-300 transition hover:text-white"
              onClick={() => setMobileNavOpen(false)}
            >
              How It Works
            </Link>
          </li>
          <li>
            <Link
              href="/blog"
              className="flex py-2 text-gray-300 transition hover:text-white"
              onClick={() => setMobileNavOpen(false)}
            >
              Blog
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="flex py-2 text-gray-300 transition hover:text-white"
              onClick={() => setMobileNavOpen(false)}
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
