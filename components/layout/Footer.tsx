'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="relative block h-6 w-6 overflow-hidden rounded-md bg-sky-600/10 ring-1 ring-sky-500/40">
            <Image
              src="/images/logo-tcredex.svg"
              alt="tCredex"
              fill
              className="object-contain p-1.5"
              sizes="24px"
            />
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            © {new Date().getFullYear()} tCredex. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden items-center gap-1 text-slate-500 sm:inline-flex">
            <span className="relative block h-6 w-6 overflow-hidden rounded-full bg-emerald-500/5 ring-1 ring-emerald-500/40">
              <Image
                src="/images/logo-aiv.svg"
                alt="American Impact Ventures"
                fill
                className="object-contain p-1.5"
                sizes="24px"
              />
            </span>
            <span>
              An{' '}
              <Link
                href="https://americanimpactventures.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-slate-200 hover:text-emerald-300"
              >
                American Impact Ventures
              </Link>{' '}
              platform
            </span>
          </span>

          <div className="flex items-center gap-3">
            <Link href="/legal/privacy" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-slate-200">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
