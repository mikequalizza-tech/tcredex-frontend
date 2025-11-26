// components/Investor/OpportunityCard.tsx

import { totalScore } from "@/utils/scoring";

export const OpportunityCard = ({ project }) => {
  const score = totalScore(project);

  return (
    <div style={{
      padding: "1rem",
      background: "#112233",
      border: "1px solid #00E7FF",
      borderRadius: "8px",
      color: "white"
    }}>
      <h3>{project.name}</h3>
      <p>Location: {project.location.city}, {project.location.state}</p>
      <p>Score: <strong>{score.toFixed(1)}</strong></p>
    </div>
  );
};
