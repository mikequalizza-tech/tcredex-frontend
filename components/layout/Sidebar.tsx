'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

type UserRole = 'sponsor' | 'cde' | 'investor' | 'admin'

type NavItem = {
  label: string
  href: string
  description?: string
}

type NavSection = {
  id: string
  label: string
  items: NavItem[]
}

const sponsorSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Sponsor',
    items: [
      { label: 'Dashboard', href: '/sponsor' },
      { label: 'My Projects', href: '/sponsor/projects' },
      { label: 'Matches', href: '/sponsor/matches' },
      { label: 'Documents', href: '/sponsor/documents' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { label: 'Intake Wizards', href: '/sponsor/intake' },
      { label: 'Scoring', href: '/sponsor/scoring' },
    ],
  },
]

const cdeSections: NavSection[] = [
  {
    id: 'overview',
    label: 'CDE',
    items: [
      { label: 'Dashboard', href: '/cde' },
      { label: 'Pipeline', href: '/cde/pipeline' },
      { label: 'Allocations', href: '/cde/allocations' },
      { label: 'Service Areas', href: '/cde/service-areas' },
      { label: 'Marketplace', href: '/cde/marketplace' },
      { label: 'Documents', href: '/cde/documents' },
    ],
  },
]

const investorSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Investor',
    items: [
      { label: 'Dashboard', href: '/investor' },
      { label: 'Funds', href: '/investor/funds' },
      { label: 'Pricing Curves', href: '/investor/pricing' },
      { label: 'Appetite', href: '/investor/appetite' },
      { label: 'Matches', href: '/investor/matches' },
      { label: 'Documents', href: '/investor/documents' },
    ],
  },
]

const adminSections: NavSection[] = [
  {
    id: 'platform',
    label: 'Platform',
    items: [
      { label: 'Overview', href: '/admin' },
      { label: 'Users & Orgs', href: '/admin/users' },
      { label: 'Scoring Engine', href: '/admin/scoring' },
      { label: 'Matching Rules', href: '/admin/matching' },
      { label: 'System Health', href: '/admin/system' },
      { label: 'Audit Log', href: '/admin/audit' },
    ],
  },
]

const roleSections: Record<UserRole, NavSection[]> = {
  sponsor: sponsorSections,
  cde: cdeSections,
  investor: investorSections,
  admin: adminSections,
}

function getRoleFromMetadata(raw: unknown): UserRole {
  if (!raw || typeof raw !== 'string') return 'sponsor'
  if (raw === 'sponsor' || raw === 'cde' || raw === 'investor' || raw === 'admin') {
    return raw
  }
  return 'sponsor'
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const role = getRoleFromMetadata(user?.publicMetadata?.role as unknown as string)
  const sections = roleSections[role]

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/95 px-3 py-6 text-sm text-slate-200 md:flex lg:w-72">
      <div className="mb-6 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-50">
          {role === 'sponsor' && 'Sponsor'}
          {role === 'cde' && 'CDE'}
          {role === 'investor' && 'Investor'}
          {role === 'admin' && 'Admin'}
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={classNames(
                        'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'bg-slate-800 text-slate-50'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-50',
                      )}
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
        <p className="font-semibold uppercase tracking-[0.18em]">Phase 1.6</p>
        <p className="mt-1 text-xs text-slate-400">
          Auth & shell ready. Scoring, matching, and Mapbox come online next.
        </p>
      </div>
    </aside>
  )
}
