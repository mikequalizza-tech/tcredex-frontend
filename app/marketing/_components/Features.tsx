export default function Features() {
  const items = [
    {
      title: 'Unified Intake',
      description:
        'Complete NMTC, LIHTC, HTC, and combo-stack project intake in a step-by-step wizard with autosave.'
    },
    {
      title: 'Scoring Engine',
      description:
        'Distress, Impact, Readiness, Sponsor Strength, and Complexity scoring with reason codes and eligibility flags.'
    },
    {
      title: 'Matching Engine',
      description:
        'Top CDE and investor recommendations automatically ranked by mandate, geography, and impact alignment.'
    },
    {
      title: 'Map & Data Layers',
      description:
        'Overlay census tracts, severely distressed, LIC, non-metro, and state program geographies using Mapbox.'
    },
    {
      title: 'Virtual Closing Room',
      description:
        'Document uploads, binder generation, AIV watermarking, and secure data rooms for closing transactions.'
    },
    {
      title: 'Workspace Assistant',
      description:
        'ChatTC integrated directly into your workspace — knows scoring rules, deal criteria, forms, and eligibility logic.'
    }
  ];

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Built for Impact Finance
          </h2>
          <p className="mt-4 text-sm text-slate-300">
            Everything you need to evaluate, structure, score, match, and close tax
            credit transactions.
          </p>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm"
            >
              <h3 className="mb-2 text-lg font-semibold text-slate-50">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
