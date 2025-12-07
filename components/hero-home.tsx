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
              Welcome to TCredex
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-200/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Your trusted digital credential exchange network.
                Instantly verify, share, and manage credentials—securely and seamlessly.
                Empowering organizations and individuals to build trust in a digital world.
              </p>
              
              {/* Why TCredex section */}
              <div 
                className="mb-8 text-left mx-auto max-w-2xl"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Why TCredex?</h2>
                <ul className="space-y-3 text-lg text-indigo-200/65">
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span>Secure, privacy-first credential management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span>Instant verification for businesses and users</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">•</span>
                    <span>Easy integration and great user experience</span>
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
