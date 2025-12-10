import { usePricing } from "@/hooks/usePricing";
export default function PricingBox() {
  const pricing = usePricing();
  if (!pricing) return null;
  return (
    <section>
      <h2>Current Pricing</h2>
      <div>{pricing.notes}</div>
    </section>
  );
}