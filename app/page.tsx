// /app/page.tsx

import HeroHome from "@/components/HeroHome";
import Features from "@/components/features";
import Cta from "@/components/cta";
import Workflows from "@/components/workflows";
import FooterSeparator from "@/components/footer-separator";
import Footer from "@/components/ui/footer";

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
