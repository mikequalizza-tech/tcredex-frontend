// components/Scoring/ScoringDashboard.tsx

"use client";

import { totalScore, scoreDistress, scoreImpact, scoreReadiness, scoreSponsor, scoreComplexity, classifyTier } from "@/utils/scoring";
import { reasonCodes } from "@/utils/reasons/reasonCodes";

export default function ScoringDashboard({ project }) {
  const distress = scoreDistress(project);
  const impact = scoreImpact(project);
  const readiness = scoreReadiness(project);
  const sponsor = scoreSponsor(project);
  const complexity = scoreComplexity(project);

  const total = totalScore(project);
  const tier = classifyTier(total);
  const reasons = reasonCodes(project);

  return (
    <div style={{ padding: "1.5rem", background: "#0D1A26", borderRadius: "12px", color: "white" }}>
      <h2 style={{ marginBottom: "1rem" }}>Project Scoring Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
        <ScoreCard label="Distress" value={distress} />
        <ScoreCard label="Impact" value={impact} />
        <ScoreCard label="Readiness" value={readiness} />
        <ScoreCard label="Sponsor Strength" value={sponsor} />
        <ScoreCard label="Complexity" value={complexity} negative />
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#112233", borderRadius: "8px" }}>
        <h3>Total Score: {total.toFixed(1)}</h3>
        <strong>{tier}</strong>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Reason Codes</h3>
        <ul>
          {reasons.map((r, index) => (
            <li key={index}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, negative = false }) {
  return (
    <div style={{
      padding: "1rem",
      background: "#112233",
      borderRadius: "8px",
      textAlign: "center"
    }}>
      <h4>{label}</h4>
      <p style={{ 
        fontSize: "1.5rem",
        color: negative ? "#FF5A5A" : "#00E7FF",
        fontWeight: "bold"
      }}>
        {value.toFixed(1)}
      </p>
    </div>
  );
}
