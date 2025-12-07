import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Footer content */}
          <div className="text-center">
            {/* tCredex blurb */}
            <p className="text-sm text-indigo-200/65 mb-6 max-w-2xl mx-auto">
              tCredex is the AI-powered tax credit marketplace for Federal & State NMTC, LIHTC, and HTC. 
              Streamline your deal flow from intake to closing.
            </p>
            
            {/* Primary CTA */}
            <div className="mb-6">
              <Link
                href="#"
                className="btn-sm bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
              >
                Sign up FREE
              </Link>
            </div>
            
            {/* Links */}
            <nav className="mb-6">
              <ul className="flex justify-center gap-6 text-sm">
                <li>
                  <Link href="/" className="text-indigo-200/65 transition hover:text-indigo-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-indigo-200/65 transition hover:text-indigo-200">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-indigo-200/65 transition hover:text-indigo-200">
                    Blog
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Copyright */}
            <div className="text-xs text-indigo-200/50">
              © tCredex
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
