import VideoThumb from "@/public/images/hero-image-01.jpg";
import ModalVideo from "@/components/modal-video";

export default function HeroHome() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              Welcome to tCredex.com — The New AI-Powered Tax Credit Marketplace — All 5 Programs, Zero Barriers
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-200/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Federal &amp; State NMTC, LIHTC, and HTC all in one platform. 
                Sponsors/Developers, CDEs, and Investors each have tailored workflows 
                to streamline deal flow, compliance, and closing.
              </p>
              
              {/* Why tCredex section */}
              <div 
                className="mb-8 text-left mx-auto max-w-2xl"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Why tCredex?</h2>
                <ul className="space-y-3 text-lg text-indigo-200/65">
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Universal Coverage</strong> — NMTC, HTC, Federal LIHTC, State LIHTC, and more</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>True Marketplace</strong> — Sponsors/Developers, CDEs, Investors custom homepages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Lightning Fast Onboarding</strong> — ~20 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Free to Use</strong> — Pay-for-performance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Automatch AI™</strong> — Matches deals, CDEs, investors, tracts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Map-Based Intelligence</strong> — Census tract data, distress overlays, eligibility</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span><strong>Fully Automated Workflow</strong> — Intake → scoring → matching → compliance → closing room</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <ModalVideo
            thumb={VideoThumb}
            thumbWidth={1104}
            thumbHeight={576}
            thumbAlt="Modal video thumbnail"
            video="videos//video.mp4"
            videoWidth={1920}
            videoHeight={1080}
          />
        </div>
      </div>
    </section>
  );
}
