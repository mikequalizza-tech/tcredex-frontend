import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Footer content */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* About section */}
            <div className="lg:col-span-2">
              <div className="mb-4 text-lg font-semibold text-gray-200">tCredex</div>
              <p className="mb-4 text-sm text-indigo-200/65">
                The AI-powered tax credit marketplace for Federal & State NMTC, LIHTC, and HTC. 
                Connecting Sponsors/Developers, CDEs, and Investors with intelligent automation.
              </p>
              <Link
                href="/signup"
                className="btn-sm bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-2 px-4 text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] inline-block"
              >
                Sign up FREE
              </Link>
            </div>

            {/* Quick Links */}
            <div>
              <div className="mb-3 text-sm font-semibold text-gray-200">Quick Links</div>
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

            {/* Copyright */}
            <div className="lg:col-span-1">
              <div className="text-sm text-indigo-200/65">
                © {new Date().getFullYear()} tCredex
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
