import Hero from './_components/Hero';
import Features from './_components/Features';
import Pricing from './_components/Pricing';
import CTA from './_components/CTA';

export default function MarketingHomePage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </div>
  );
}
