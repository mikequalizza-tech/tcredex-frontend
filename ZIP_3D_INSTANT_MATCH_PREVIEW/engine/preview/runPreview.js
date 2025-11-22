import { match } from '../../engine/matchEngine.js';
import { explainMatch } from '../../engine/reasons/explain.js';

export function runPreview(project, cdes, investors){
  const cdeMatches = cdes.map(cde=>{
    const scores = match(project, cde, investors[0]||{minImpact:0});
    const explanation = explainMatch(project, cde, investors[0]||{}, scores);
    return { cde, total: scores.total, explanation };
  }).sort((a,b)=>b.total - a.total);

  const investorMatches = investors.map(inv=>{
    const scores = match(project, cdes[0]||{}, inv);
    const explanation = explainMatch(project, cdes[0]||{}, inv, scores);
    return { investor: inv, total: scores.total, explanation };
  }).sort((a,b)=>b.total - a.total);

  return { cdeMatches, investorMatches };
}
