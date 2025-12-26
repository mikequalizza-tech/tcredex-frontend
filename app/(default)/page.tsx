import HeroHome from "@/components/HeroHome";
import Features from "@/components/features";
import FeaturedDeals from "@/components/FeaturedDeals";
import Workflows from "@/components/workflows";
import NoRiskSection from "@/components/NoRiskSection";
import Cta from "@/components/cta";
import MapSection from "@/components/MapSection";

export default function HomePage() {
  return (
    <>
      <HeroHome />
      <Features />
      <NoRiskSection />
      <FeaturedDeals />
      <MapSection 
        title="Tax Credit Eligibility Lookup" 
        description="Search any U.S. address for all 5 federal credits (NMTC, LIHTC QCT, DDA, HTC, OZ) plus state programs. No login required." 
        showLegend 
        showSearch 
      />
      <Workflows />
      <Cta />
    </>
  );
}
