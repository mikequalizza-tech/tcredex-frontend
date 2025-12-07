import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CDE Workspace | tCredex',
}

export default function CdeDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">CDE dashboard</h1>
      <p className="text-sm text-slate-300">
        Phase B will show your pipeline, allocations, and service areas here.
      </p>
    </section>
  )
}
