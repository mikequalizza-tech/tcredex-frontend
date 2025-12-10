export const metadata = {
  title: "Dashboard - tCredex",
  description:
    "A secure dashboard for monitoring tax credit deals, counterparties, and servicing tasks across the tCredex marketplace.",
};

import PageIllustration from "@/components/page-illustration";

export default function DashboardPlaceholder() {
  return (
    <>
      <PageIllustration multiple />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="rounded-2xl border border-indigo-500/30 bg-gray-900/70 p-8 text-center shadow-[0_20px_70px_-25px_rgba(0,0,0,0.6)]">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-200/70">
                Coming soon
              </p>
              <h1 className="pb-4 font-nacelle text-4xl font-semibold text-gray-50 md:text-5xl">
                Your tCredex dashboard
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-indigo-100/70">
                This area will surface pipeline visibility, underwriting checklists, servicing alerts, and data room access for every deal you manage. The sitemap link is live so stakeholders can see where this experience will live as we build it out.
              </p>
              <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-800/80 bg-gray-800/60 px-4 py-3 text-left text-sm text-indigo-100/70">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden={true} />
                <span>
                  We're finalizing the productized flows here. For now, navigation remains so partners know a dashboard is part of the roadmap.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
