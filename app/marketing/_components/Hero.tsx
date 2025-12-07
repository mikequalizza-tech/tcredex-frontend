'use client';

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
            American Impact Ventures
          </p>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The Operating System for Impact Tax Credit Deals.
          </h1>

          <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            tCredex connects sponsors, CDEs, and investors to structure, score, match,
            and close NMTC, LIHTC, HTC, and state tax credit transactions — all in one
            shared workspace.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="/sign-up"
              className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
            >
              Get Started
            </a>

            <a
              href="/how-it-works"
              className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-50 hover:border-sky-400 hover:text-sky-300"
            >
              How It Works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
