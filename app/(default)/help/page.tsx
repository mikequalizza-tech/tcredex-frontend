import type { Metadata } from "next";
import { getHelpPages } from "@/components/mdx/utils";
import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata: Metadata = {
  title: "Help Center - tCredex",
  description: "Get help with tCredex - the AI-powered marketplace for tax credit financing.",
};

export default function HelpIndex() {
  const helpPages = getHelpPages();

  // Define the order and filter for displayed help topics
  const orderedSlugs = [
    "what-is-tcredex",
    "get-started",
    "tcredex-plans",
    "frequently-asked-questions",
  ];

  const orderedPages = orderedSlugs
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

          {/* Help Topics Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {orderedPages.map((page) => (
              <Link
                key={page!.slug}
                href={`/help/${page!.slug}`}
                className="group rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-6 backdrop-blur-xs transition hover:from-gray-900/70 hover:via-gray-800/40 hover:to-gray-900/70 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] relative"
              >
                <h2 className="mb-2 text-lg font-semibold text-gray-200 group-hover:text-indigo-400 transition">
                  {page!.metadata.title}
                </h2>
                {page!.metadata.summary && (
                  <p className="text-sm text-indigo-200/65">
                    {page!.metadata.summary}
                  </p>
                )}
                <div className="mt-4 flex items-center text-sm text-indigo-500 group-hover:text-indigo-400 transition">
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

          {/* Contact Support */}
          <div className="mt-12 text-center">
            <p className="text-indigo-200/65 mb-4">
              Can't find what you're looking for?
            </p>
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
      <FooterSeparator />
    </>
  );
}
