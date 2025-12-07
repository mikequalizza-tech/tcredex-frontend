export default function CdeDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-50">CDE Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Pipeline Deals</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Allocation Remaining</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">$0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Service Areas</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Recent Project Matches</h2>
        <p className="mt-2 text-sm text-slate-400">No matches yet.</p>
      </div>
    </div>
  );
}

