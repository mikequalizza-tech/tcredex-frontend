export default function CTA() {
  return (
    <section className="border-t border-slate-800 bg-slate-900 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
          Ready to Transform Community Finance?
        </h2>

        <p className="mt-4 text-sm text-slate-300">
          tCredex streamlines project evaluation, scoring, matching, and closing —
          built for American Impact Ventures and the entire CDFI ecosystem.
        </p>

        <div className="mt-8">
          <a
            href="/sign-up"
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
}
