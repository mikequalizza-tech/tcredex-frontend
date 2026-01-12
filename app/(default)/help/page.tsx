import type { Metadata } from "next";
import { getHelpPages } from "@/components/mdx/utils";
import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata: Metadata = {
  title: "Help Center - tCredex",
  description: "Get help with tCredex - the AI-powered marketplace for tax credit financing.",
};

interface HelpSection {
  title: string;
  description: string;
  icon: string;
  slugs: string[];
}

export default function HelpIndex() {
  const helpPages = getHelpPages();

  // Organized help sections
  const sections: HelpSection[] = [
    {
      title: "Getting Started",
      description: "Learn the basics of tCredex",
      icon: "🚀",
      slugs: ["what-is-tcredex", "system-overview", "get-started", "create-account"],
    },
    {
      title: "Account Guides",
      description: "Role-specific guides for your account type",
      icon: "👥",
      slugs: ["sponsor-account-guide", "cde-account-guide", "investor-account-guide", "roles-and-teams"],
    },
    {
      title: "Platform Features",
      description: "Learn how to use tCredex features",
      icon: "⚙️",
      slugs: ["tCredex_Intake_Form", "automatch-explained", "closing-room-guide", "map-source-of-truth", "how-chatTC-works"],
    },
    {
      title: "Plans & Pricing",
      description: "Subscription plans and payment info",
      icon: "💳",
      slugs: ["tcredex-plans", "payments-faqs"],
    },
    {
      title: "Security & Privacy",
      description: "How we protect your data",
      icon: "🔒",
      slugs: ["data-security"],
    },
  ];

  const getPagesBySection = (slugs: string[]) =>
    slugs
      .map(slug => helpPages.find(page => page.slug === slug))
      .filter(Boolean);

  return (
    <>
      <PageIllustration multiple />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Help Center
            </h1>
            <p className="text-lg text-indigo-200/65">
              Everything you need to know about tCredex
            </p>
          </div>

          {/* Help Sections */}
          <div className="space-y-12">
            {sections.map((section) => {
              const pages = getPagesBySection(section.slugs);
              if (pages.length === 0) return null;

              return (
                <div key={section.title}>
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{section.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-200">{section.title}</h2>
                      <p className="text-sm text-indigo-200/65">{section.description}</p>
                    </div>
                  </div>

                  {/* Section Topics Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {pages.map((page) => (
                      <Link
                        key={page!.slug}
                        href={`/help/${page!.slug}`}
                        className="group rounded-xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-xs transition hover:from-gray-900/70 hover:via-gray-800/40 hover:to-gray-900/70 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative"
                      >
                        <h3 className="mb-1 font-semibold text-gray-200 group-hover:text-indigo-400 transition">
                          {page!.metadata.title}
                        </h3>
                        {page!.metadata.summary && (
                          <p className="text-sm text-indigo-200/65 line-clamp-2">
                            {page!.metadata.summary}
                          </p>
                        )}
                        <div className="mt-3 flex items-center text-sm text-indigo-500 group-hover:text-indigo-400 transition">
                          <span>Read more</span>
                          <svg
                            className="ml-2 h-3 w-3 transform transition group-hover:translate-x-1"
                            viewBox="0 0 12 12"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Have Questions?</h2>
            <p className="text-indigo-200/65 mb-6">
              Check our FAQ or contact our support team
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/help/frequently-asked-questions"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                View FAQ
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Contact Support
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FooterSeparator />
    </>
  );
}
