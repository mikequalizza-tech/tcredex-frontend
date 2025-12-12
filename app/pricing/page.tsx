export const metadata = {
  title: "Pricing - tCredex",
  description: "Transparent pricing for tCredex tax credit marketplace platform",
};

import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";
import Hero from "@/components/heropricing";
import Faqs from "@/components/faqs";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";

export default function Pricing() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <Faqs />
      <Testimonials />
      <Cta />
    </>
  );
}
