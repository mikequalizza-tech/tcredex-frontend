export default function SponsorDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-50">Sponsor Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Projects Submitted</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Active Matches</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Documents Uploaded</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Start a New Intake</h2>
        <p className="mt-2 text-sm text-slate-400">
          Begin NMTC, LIHTC, HTC, or Combo-stack intake using our guided wizard.
        </p>
        <a
          href="/sponsor/intake"
          className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
        >
          Start Intake
        </a>
      </div>
    </div>
  );
}
