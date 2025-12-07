export default function Pricing() {
  return (
    <section className="border-t border-slate-800 bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">Pricing</h2>
        <p className="mt-3 text-sm text-slate-300">
          Flexible plans for sponsors, CDEs, investors, and administrators.
        </p>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 shadow">
            <h3 className="text-xl font-semibold text-slate-50">Sponsor</h3>
            <p className="mt-4 text-slate-300">$499 / year</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-slate-400">
              <li>✔ Unlimited Project Intakes</li>
              <li>✔ Full Scoring & Matching Engine</li>
              <li>✔ PDF Export & Document Room</li>
            </ul>
            <a
              href="/sign-up"
              className="mt-8 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              Get Started
            </a>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 shadow">
            <h3 className="text-xl font-semibold text-slate-50">CDE / Investor</h3>
            <p className="mt-4 text-slate-300">$2,500 / year</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-slate-400">
              <li>✔ Mandate & Geography Matching</li>
              <li>✔ Deal Pipeline & Filters</li>
              <li>✔ Team Access & Admin Console</li>
            </ul>
            <a
              href="/sign-up"
              className="mt-8 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              Become a Partner
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
