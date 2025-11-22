export function snapshot(scores, reasons){
  return {
    timestamp: new Date().toISOString(),
    total: scores.total,
    rule: scores.rule,
    ai: scores.ai,
    reasons,
    confidence: scores.ai > 50 ? "high" : "medium",
    suggestions: [
      scores.rule < 20 ? "Increase distress alignment or target more severely distressed tracts." : null,
      scores.ai < 40 ? "Improve project documentation to increase AI confidence." : null
    ].filter(Boolean)
  };
}
