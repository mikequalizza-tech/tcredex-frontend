// /app/page.tsx
import HeroHome from "@/components/HeroHome";
import Features from "@/components/features";
import Workflows from "@/components/workflows";
import Cta from "@/components/cta";
import FooterSeparator from "@/components/FooterSeparator";
import Footer from "@/components/ui/footer";

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
