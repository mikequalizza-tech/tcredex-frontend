// /app/page.tsx
import HeroHome from "@/components/HeroHome";
import Features from "@/components/Features";
import Workflows from "@/components/Workflows";
import Cta from "@/components/Cta";
import FooterSeparator from "@/components/FooterSeparator";
import Footer from "@/components/ui/Footer";

export const metadata = {
  title: "Home - tCredex",
  description: "AI-Powered Tax Credit Marketplace for NMTC, LIHTC, HTC, OZ, Brownfield.",
};

export default function HomePage() {
  return (
    <>
      <HeroHome />
      <Features />
      <Workflows />
      <Cta />
      <FooterSeparator />
      <Footer />
    </>
  );
}

