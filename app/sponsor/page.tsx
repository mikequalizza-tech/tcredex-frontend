import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sponsor Workspace | tCredex',
}

export default function SponsorDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Sponsor dashboard</h1>
      <p className="text-sm text-slate-300">
        Phase B will surface active deals, intake status, and impact stats here.
      </p>
    </section>
  )
}
