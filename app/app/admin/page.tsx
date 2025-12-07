export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-50">Admin Console</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Total Projects</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Users</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">CDE Partners</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-slate-300">Investor Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-sky-400">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          System Activity
        </h2>
        <p className="mt-2 text-sm text-slate-400">No system logs yet.</
