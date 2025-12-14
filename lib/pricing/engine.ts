export interface PricingInputs {
  deal: any;
  impact: any;
  risk: any;
  market: any;
  investor_persona: any;
}

export interface PricingTier {
  tier: "Good" | "Better" | "Best";
  price: number;
  irr: number;
  craScore: number;
  probabilityClose: number;
  rationale: string[];
}

export function computePricing(inputs: PricingInputs): PricingTier[] {
  const {
    deal,
    impact,
    risk,
    market,
    investor_persona: persona
  } = inputs;

  const compAvg = market.recent_prints.reduce((sum: number, p: any) => sum + p.price, 0) / market.recent_prints.length;

  const riskPenalty = (risk.construction_risk * 0.01 +
    (1 - risk.sponsor_track_record) * 0.02 +
    (1 - risk.backstop_strength) * 0.015 +
    (1.25 - risk.coverage_ratio) * 0.02);

  const craBoost = (impact.distress_score * 0.0005 +
    (impact.tract.anchor_type !== "none" ? 0.01 : 0)) * persona.cra_pressure;

  const yieldPull = (persona.yield_target - 0.05) * -0.5;
  const basePrice = compAvg - riskPenalty + craBoost + yieldPull;

  function computeTier(mult: number): PricingTier {
    const price = Number((basePrice + mult).toFixed(2));
    const irr = Number((persona.yield_target + (0.92 - price) * 0.1).toFixed(3));
    const craScore = Number((impact.impact_score * persona.cra_pressure).toFixed(1));
    const probabilityClose = Math.min(
      0.95,
      Number((0.85 - riskPenalty * 4 + (price - compAvg) * -1 + persona.optics_weight * 0.05).toFixed(2))
    );

    return {
      tier: mult === -0.02 ? "Good" : mult === 0 ? "Better" : "Best",
      price,
      irr,
      craScore,
      probabilityClose,
      rationale: [
        `Risk penalty: ${riskPenalty.toFixed(3)}`,
        `CRA uplift: ${craBoost.toFixed(3)}`,
        `Yield influence: ${yieldPull.toFixed(3)}`
      ]
    };
  }

  return [computeTier(-0.02), computeTier(0), computeTier(0.02)];
}
