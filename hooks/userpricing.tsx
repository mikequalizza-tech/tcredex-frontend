import { useEffect, useState } from "react";

export function usePricing() {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then(res => res.json())
      .then(setPricing);
  }, []);

  return pricing;
}