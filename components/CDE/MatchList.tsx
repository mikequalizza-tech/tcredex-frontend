// components/CDE/MatchList.tsx

"use client";

import { totalScore } from "@/utils/scoring";
import { reasonCodes } from "@/utils/reasons/reasonCodes";

export const MatchList = ({ projects }) => {
  const ranked = projects
    .map(p => ({ project: p, score: totalScore(p) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div style={{ color: "white" }}>
      <h2>Matched Projects</h2>
      {ranked.map((item, idx) => (
        <div key={idx} style={{ padding: "1rem", background: "#112233", marginBottom: "1rem", borderRadius: "8px" }}>
          <h3>{item.project.name}</h3>
          <p>Score: {item.score.toFixed(1)}</p>
          <ul>
            {reasonCodes(item.project).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};
