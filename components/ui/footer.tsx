import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Footer content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Navigation Links - Left side */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Navigation</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/" className="transition hover:text-gray-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="transition hover:text-gray-200">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-gray-200">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="transition hover:text-gray-200">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Support</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/contact" className="transition hover:text-gray-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="transition hover:text-gray-200">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition hover:text-gray-200">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-gray-200">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright and Affiliate Disclaimer */}
            <div>
              <div className="text-sm text-indigo-200/65 space-y-3">
                <p>© {new Date().getFullYear()} tCredex</p>
                <p className="text-xs">
                  Tcredex.com is an affiliate of American Impact Ventures LLC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Chat Bot will appear in lower right-hand corner */}
      {/* Chat bot implementation to be added separately */}
    </footer>
  );
}
