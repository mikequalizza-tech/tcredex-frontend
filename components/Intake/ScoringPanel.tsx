// components/Intake/ScoringPanel.tsx

"use client";

import { totalScore, classifyTier } from "@/utils/scoring";

export const ScoringPanel = ({ project }) => {
  const total = totalScore(project);
  const tier = classifyTier(total);

  return (
    <div style={{
      background: "#112233",
      padding: "1rem",
      borderRadius: "8px",
      color: "white"
    }}>
      <h3>Live Scoring</h3>
      <p>Total Score: <strong>{total.toFixed(1)}</strong></p>
      <p>Tier: <strong>{tier}</strong></p>
    </div>
  );
};
