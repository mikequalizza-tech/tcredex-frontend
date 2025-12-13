import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works - tCredex",
  description:
    "See how tCredex pairs AI-driven diligence with a transparent marketplace to streamline tax credit investments.",
};

import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

const steps = [
  {
    title: "Source and screen",
    body: "Sellers list projects and upload diligence data. Our models flag eligibility, recapture risk, and compliance gaps upfront.",
  },
  {
    title: "Structure with confidence",
    body: "Configurable underwriting checklists and templated workflows keep investors, developers, and advisors aligned through closing.",
  },
  {
    title: "Monitor and report",
    body: "Post-closing servicing, document tracking, and automated alerts keep portfolios audit-ready and stakeholders informed.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <PageIllustration multiple />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="pb-12 text-center">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                How tCredex works
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-indigo-200/65">
                A clear, auditable path from project discovery to funded tax credits. These sections will deepen as we ship the full product.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-gray-800/80 bg-gray-900/70 p-6 shadow-[0_15px_70px_-15px_rgba(0,0,0,0.45)]"
                >
                  <h2 className="pb-3 font-nacelle text-xl text-gray-50">{step.title}</h2>
                  <p className="text-indigo-100/70">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 text-center">
              <p className="text-lg text-indigo-100/70">
                We built this sitemap for the full tCredex experience. More guided flows and data rooms are coming soon as we build out each section.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
