export const metadata = {
  title: "Home - tCredex",
  description: "tCredex.com - The AI-Powered Tax Credit Marketplace for Federal & State NMTC, LIHTC, and HTC",
};

import PageIllustration from "@/components/page-illustration";
import Hero from "@/components/hero-home";
import FeaturedDeals from "@/components/featured-deals";
import Features from "@/components/features";
import MapSection from "@/components/map-section";
import SplitCarousel from "@/components/split-carousel";
import Pricing from "@/components/pricing-home";
import Cta from "@/components/cta";

export default function Home() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <FeaturedDeals />
      <Features />
      <MapSection />
      <SplitCarousel />
      <Pricing />
      <Cta />
    </>
  );
}
