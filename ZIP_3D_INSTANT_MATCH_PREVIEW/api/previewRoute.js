import express from 'express';
import { runPreview } from '../engine/preview/runPreview.js';

const router = express.Router();

router.post('/preview', (req,res)=>{
  const { project, cdes, investors } = req.body;
  const preview = runPreview(project, cdes||[], investors||[]);
  return res.json(preview);
});

export default router;
