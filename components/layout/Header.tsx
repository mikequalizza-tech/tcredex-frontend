'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const PRIMARY_NAV = [
  { label: 'Sponsor', href: '/sponsor' },
  { label: 'CDE', href: '/cde' },
  { label: 'Investor', href: '/investor' },
]

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative block h-7 w-7 overflow-hidden rounded-lg bg-sky-600/10 ring-1 ring-sky-500/40">
              <Image
                src="/images/logo-tcredex.svg"
                alt="tCredex"
                fill
                className="object-contain p-1.5"
                sizes="32px"
                priority
              />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-slate-50">tCredex</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Impact Tax Credit Exchange
              </span>
            </div>
          </Link>
        </div>

        {/* Primary workspace tabs */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-slate-300 sm:flex">
          {PRIMARY_NAV.map((item) => {
            const active =
              pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  'rounded-md px-3 py-1.5 transition-colors',
                  active
                    ? 'bg-slate-800 text-slate-50'
                    : 'hover:bg-slate-800/70 hover:text-slate-50',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* ChatTC entrypoint (Phase H will wire behaviour) */}
          <button
            type="button"
            aria-disabled="true"
            className="hidden items-center rounded-md border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-sm shadow-emerald-900/70 hover:bg-emerald-500/20 sm:inline-flex"
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ChatTC
            <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]">
              beta
            </span>
          </button>

          <SignedOut>
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800/70"
            >
              Sign in
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
