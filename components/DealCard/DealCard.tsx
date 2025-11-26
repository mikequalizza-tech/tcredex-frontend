// components/DealCard/DealCard.tsx

import { totalScore } from "@/utils/scoring";
import { reasonCodes } from "@/utils/reasons/reasonCodes";

export const DealCard = ({ project }) => {
  const score = totalScore(project);

  return (
    <div style={{ padding: "2rem", background: "white", color: "#071B2C", borderRadius: "12px" }}>
      <h1>{project.name}</h1>
      <h3>{project.location.city}, {project.location.state}</h3>

      <p><strong>Total Score: {score.toFixed(1)}</strong></p>

      <h3>Reasons</h3>
      <ul>
        {reasonCodes(project).map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
};
