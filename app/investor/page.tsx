import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Workspace | tCredex',
}

export default function InvestorDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Investor dashboard</h1>
      <p className="text-sm text-slate-300">
        Phase B will surface funds, pricing curves, and appetite settings here.
      </p>
    </section>
  )
}
