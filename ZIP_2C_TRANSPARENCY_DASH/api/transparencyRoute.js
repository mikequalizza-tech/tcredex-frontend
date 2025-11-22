import express from 'express';
import { match } from '../engine/matchEngine.js';
import { explainMatch } from '../engine/reasons/explain.js';
import { snapshot } from '../engine/transparency/snapshot.js';

const router = express.Router();

router.post('/transparency', (req,res)=>{
  const { project, cde, investor } = req.body;
  const scores = match(project, cde, investor);
  const explanation = explainMatch(project, cde, investor, scores);
  const snap = snapshot(scores, explanation.reasons);
  return res.json({ ...explanation, snapshot: snap });
});

export default router;
