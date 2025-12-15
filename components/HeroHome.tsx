import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function HeroHome() {
  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-16">
            <div
              className="mb-6 border-y border-gray-800 [border-image:linear-gradient(to_right,transparent,--theme(--color-gray-700/.7),transparent)_1]"
              data-aos="zoom-y-out"
            >
              <div className="-my-px mx-auto max-w-[36rem] [background:linear-gradient(to_right,transparent,--theme(--color-gray-800),transparent)_border-box]">
                <div className="bg-gray-900/60 relative px-4 py-3">
                  <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                    The AI-Powered Tax Credit Marketplace
                  </span>
                </div>
              </div>
            </div>
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              Connect Deals. Deploy Capital.
              <br className="max-lg:hidden" />
              Transform Communities.
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-indigo-200/65"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                tCredex brings together Project Sponsors, CDEs, and Investors on a single intelligent platform. 
                From census tract eligibility to closing room — powered by AI matching across NMTC, LIHTC, HTC, 
                Opportunity Zones, and Brownfield credits.
              </p>
              <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-gray-700/.7),transparent)_1]">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <Link
                    className="btn group mb-4 w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="/map"
                  >
                    <span className="relative inline-flex items-center">
                      Explore the Map
                      <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </Link>
                  <Link
                    className="btn relative w-full bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                    href="/how-it-works"
                  >
                    How It Works
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className="mx-auto max-w-3xl"
            data-aos="zoom-y-out"
            data-aos-delay={600}
          >
            <div className="relative rounded-2xl border border-gray-700/50 bg-gray-900/50 px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-400">$450M</p>
                  <p className="text-xs text-gray-500">Historic Tax Credit Investments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">85</p>
                  <p className="text-xs text-gray-500">NMTC Projects Closed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">$3B</p>
                  <p className="text-xs text-gray-500">LIHTC Syndication</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">$350M</p>
                  <p className="text-xs text-gray-500">State Tax Credits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">$650M</p>
                  <p className="text-xs text-gray-500">NMTC Allocation Closed</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
