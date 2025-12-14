import HeroHome from "@/components/HeroHome";
import Features from "@/components/features";
import Workflows from "@/components/workflows";
import Cta from "@/components/cta";
import MapSection from "@/components/MapSection";

export default function HomePage() {
  return (
    <>
      <HeroHome />
      <Features />
      <MapSection 
        title="Free Census Tract Check" 
        description="Search any U.S. address to determine NMTC, LIHTC, and HTC eligibility instantly. No login required." 
        showLegend 
        showSearch 
      />
      <Workflows />
      <Cta />
    </>
  );
}
