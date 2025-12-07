// app/page.tsx
import Link from 'next/link';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 px-6 py-8 shadow-xl shadow-slate-950/70 sm:px-10 sm:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              tCredex 1.6
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              Impact Tax Credit Marketplace
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Connect sponsors, CDEs, and investors across NMTC, LIHTC, HTC, and state credit
              transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-50 hover:border-sky-400 hover:text-sky-300">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-sky-400 sm:inline-flex">
                  Get started
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>

        <SignedIn>
          <section className="grid gap-4 sm:grid-cols-3">
            <WorkspaceCard
              title="Sponsor workspace"
              description="Submit projects and manage matches with CDEs and investors."
              href="/sponsor"
            />
            <WorkspaceCard
              title="CDE workspace"
              description="Track allocation pipeline, service areas, and deal rooms."
              href="/cde"
            />
            <WorkspaceCard
              title="Investor workspace"
              description="Monitor funds, pricing curves, and tax credit exposure."
              href="/investor"
            />
          </section>
        </SignedIn>

        <SignedOut>
          <section className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              Sign in or create an account to access your Sponsor, CDE, or Investor workspace. Once
              authenticated, you&apos;ll be routed into the appropriate dashboard.
            </p>
            <p className="text-xs text-slate-500">
              Phase A: Auth + shell is in place. Phase B will light up live dashboards and scoring
              tiles for your deals.
            </p>
          </section>
        </SignedOut>
      </div>
    </main>
  );
}

type WorkspaceCardProps = {
  title: string;
  description: string;
  href: string;
};

function WorkspaceCard({ title, description, href }: WorkspaceCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-sky-500/70 hover:bg-slate-900"
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <span className="mt-3 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
        Open workspace
        <svg
          className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M7 17L17 7M17 7H9M17 7V15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
