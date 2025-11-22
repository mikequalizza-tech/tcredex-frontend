import express from 'express';
import { commitAllocation } from '../engine/investor/commitAllocation.js';
import { updateCommit } from '../engine/investor/updateCommit.js';

let commits = [];

const router = express.Router();

router.post('/investor/commit', (req,res)=>{
  const { projectId, investorId, amount } = req.body;
  const c = commitAllocation(projectId, investorId, amount);
  commits.push(c);
  return res.json(c);
});

router.post('/investor/commit/update', (req,res)=>{
  const { id, status } = req.body;
  const commit = commits.find(c=>c.id===id);
  const updated = updateCommit(commit, status);
  commits = commits.map(c=>c.id===id?updated:c);
  return res.json(updated);
});

router.get('/investor/commits/:projectId', (req,res)=>{
  const out = commits.filter(c=>c.projectId===req.params.projectId);
  return res.json(out);
});

export default router;
