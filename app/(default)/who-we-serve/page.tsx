import type { Metadata } from "next";
import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata: Metadata = {
  title: "Who We Serve - tCredex",
  description: "tCredex serves Project Sponsors, CDEs, and Tax Credit Investors with tailored tools.",
};

const userTypes = [
  {
    title: "Project Sponsors",
    subtitle: "Developers & Nonprofits",
    description: "You have a project that could transform a community. We help you find the right tax credit partners.",
    benefits: [
      "Submit your project in ~20 minutes",
      "Instant census tract qualification lookup",
      "AutoMatch AI connects you with aligned CDEs",
      "Real-time pricing guidance",
      "Track your deal from intake to closing",
    ],
    cta: "Submit a Project",
    ctaLink: "/dashboard/projects/new",
    icon: "🏗️",
  },
  {
    title: "CDEs",
    subtitle: "Community Development Entities",
    description: "You have allocation to deploy. We bring you a pre-qualified pipeline of shovel-ready projects.",
    benefits: [
      "Curated pipeline by geography and project type",
      "3-Deal Rule shows your top 3 matches",
      "Automated QALICB eligibility screening",
      "Impact scoring for reporting",
      "Closing room tools for compliance",
    ],
    cta: "Browse Pipeline",
    ctaLink: "/cde",
    icon: "🏛️",
  },
  {
    title: "Investors",
    subtitle: "Banks, Corporations & Family Offices",
    description: "You need CRA-qualifying investments with strong returns. We surface vetted opportunities.",
    benefits: [
      "Filter by CRA area, project type, impact level",
      "Clear pricing with IRR projections",
      "Comprehensive deal memos",
      "Portfolio tracking across programs",
      "Direct access to CDEs and sponsors",
    ],
    cta: "View Opportunities",
    ctaLink: "/investor",
    icon: "💼",
  },
];

export default function WhoWeServePage() {
  return (
    <>
      <PageIllustration multiple />
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="mx-auto max-w-3xl pb-12 text-center">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                Who We Serve
              </h1>
              <p className="text-lg text-indigo-200/65">
                tCredex connects all parties in the tax credit ecosystem.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 mb-16">
              {userTypes.map((user) => (
                <div key={user.title} className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-6 hover:border-indigo-500/50 transition-colors flex flex-col">
                  <div className="text-5xl mb-4">{user.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-1">{user.title}</h3>
                  <p className="text-sm text-indigo-400 mb-4">{user.subtitle}</p>
                  <p className="text-gray-400 mb-6">{user.description}</p>
                  <ul className="space-y-3 mb-6 flex-1">
                    {user.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">✓</span>{b}
                      </li>
                    ))}
                  </ul>
                  <Link href={user.ctaLink} className="w-full py-3 text-center font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                    {user.cta}
                  </Link>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">Ready to Get Started?</h2>
              <p className="text-indigo-200/65 mb-6 max-w-xl mx-auto">
                Whether you&apos;re submitting a project, deploying allocation, or seeking investments, tCredex has the tools you need.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/signup" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors">
                  Create Account
                </Link>
                <Link href="/map" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition-colors">
                  Explore the Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterSeparator />
    </>
  );
}
