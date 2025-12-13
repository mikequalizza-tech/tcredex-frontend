import HeroHome from "@/components/HeroHome";
import Features from "@/components/features";
import Workflows from "@/components/workflows";
import Cta from "@/components/cta";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata = {
  title: "Home - tCredex",
  description:
    "AI-Powered 5-Tax Credit Marketplace including State and Federal Tax Credits for NMTC, LIHTC, HTC, OZ, Brownfield.",
};

export default function HomePage() {
  return (
    <>
      <HeroHome />
      <Features />
      <Workflows />
      <Cta />
      <FooterSeparator />
    </>
  );
}
