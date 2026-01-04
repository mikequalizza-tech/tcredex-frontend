'use client';

import Link from 'next/link';

/**
 * Compact footer for internal/dashboard pages
 * Provides quick links without the full marketing footer weight
 */
export default function InternalFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Quick Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link href="/programs" className="hover:text-gray-200 transition-colors">
              Programs
            </Link>
            <Link href="/how-it-works" className="hover:text-gray-200 transition-colors">
              How It Works
            </Link>
            <Link href="/blog" className="hover:text-gray-200 transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="hover:text-gray-200 transition-colors">
              Contact
            </Link>
          </div>

          {/* Center: Support & Docs */}
          <div className="flex items-center gap-x-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-200 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gray-200 transition-colors">
              Privacy
            </Link>
          </div>

          {/* Right: Copyright */}
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} tCredex
          </div>
        </div>
      </div>
    </footer>
  );
}
