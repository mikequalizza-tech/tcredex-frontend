import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Workspace | tCredex',
}

export default function AdminDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Platform admin</h1>
      <p className="text-sm text-slate-300">
        Phase B/C will expose controls for scoring weights, matching rules, and user management here.
      </p>
    </section>
  )
}
