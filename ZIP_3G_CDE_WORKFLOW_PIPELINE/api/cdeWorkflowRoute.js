import express from 'express';
import { routeToCDEs } from '../engine/cdeWorkflow/routeToCDEs.js';
import { updateCDEStatus } from '../engine/cdeWorkflow/statusUpdate.js';

const router = express.Router();

router.post('/cde/route', (req,res)=>{
  const { project, matchedCDEs } = req.body;
  const routed = routeToCDEs(project, matchedCDEs);
  return res.json(routed);
});

router.post('/cde/status', (req,res)=>{
  const { record, status } = req.body;
  const updated = updateCDEStatus(record, status);
  return res.json(updated);
});

export default router;
