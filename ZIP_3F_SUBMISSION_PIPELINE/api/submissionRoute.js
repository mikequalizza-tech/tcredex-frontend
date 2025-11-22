import express from 'express';
import { createProjectRecord } from '../engine/submission/createProject.js';
import { initVaultFolders } from '../engine/submission/vaultInit.js';
import { generateReadinessReport } from '../engine/submission/readinessReport.js';

const router = express.Router();

router.post('/submit', (req,res)=>{
  const { intakeData, precheck, preview, recommendations } = req.body;

  const { project, auditRec } = createProjectRecord(intakeData);
  const vault = initVaultFolders(project.id);
  const readiness = generateReadinessReport(precheck, preview, recommendations);

  return res.json({
    project,
    vault,
    readiness,
    audit: auditRec
  });
});

export default router;
