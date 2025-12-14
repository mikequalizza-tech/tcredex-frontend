import Link from "next/link";
import Image from "next/image";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Logo and tagline */}
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div className="h-8 w-px bg-gray-700" />
              <Image
                src="/brand/aiv-tree.png"
                alt="American Impact Ventures"
                width={40}
                height={40}
                className="opacity-70"
              />
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              No risk. You don't close, we don't get paid.
            </p>
          </div>

          {/* Footer content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Platform Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Platform</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/deals" className="transition hover:text-gray-200">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="transition hover:text-gray-200">
                    Deal Map
                  </Link>
                </li>
                <li>
                  <Link href="/automatch" className="transition hover:text-gray-200">
                    AutoMatch AI
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="transition hover:text-gray-200">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tax Credit Programs */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Programs</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/programs/nmtc" className="transition hover:text-gray-200">
                    NMTC
                  </Link>
                </li>
                <li>
                  <Link href="/programs/lihtc" className="transition hover:text-gray-200">
                    LIHTC
                  </Link>
                </li>
                <li>
                  <Link href="/programs/htc" className="transition hover:text-gray-200">
                    HTC
                  </Link>
                </li>
                <li>
                  <Link href="/programs/oz" className="transition hover:text-gray-200">
                    Opportunity Zones
                  </Link>
                </li>
                <li>
                  <Link href="/programs/brownfield" className="transition hover:text-gray-200">
                    Brownfield
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Company</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
                <li>
                  <Link href="/about" className="transition hover:text-gray-200">
                    About tCredex
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="transition hover:text-gray-200">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/who-we-serve" className="transition hover:text-gray-200">
                    Who We Serve
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-gray-200">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition hover:text-gray-200">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Contact */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Legal</div>
              <ul className="space-y-2 text-sm text-indigo-200/65">
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
              
              <div className="mt-6 text-sm text-indigo-200/65 space-y-2">
                <p>© {new Date().getFullYear()} tCredex</p>
                <p className="text-xs text-gray-500">
                  An affiliate of American Impact Ventures LLC
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
