import express from 'express';
import { initDealRoom } from '../engine/dealroom/initDealRoom.js';
import { uploadDoc } from '../engine/dealroom/uploadDoc.js';
import { addVersion } from '../engine/dealroom/addVersion.js';

let dealRooms = [];

const router = express.Router();

router.post('/dealroom/init', (req,res)=>{
  const { projectId } = req.body;
  const dr = initDealRoom(projectId);
  dealRooms.push(dr);
  return res.json(dr);
});

router.post('/dealroom/upload', (req,res)=>{
  const { projectId, folderName, docMeta } = req.body;
  const dr = dealRooms.find(d=>d.projectId===projectId);
  const doc = uploadDoc(dr, folderName, docMeta);
  return res.json(doc);
});

router.post('/dealroom/version', (req,res)=>{
  const { projectId, docId, versionMeta } = req.body;
  const dr = dealRooms.find(d=>d.projectId===projectId);
  const folder = dr.folders.find(f=>f.docs.find(d=>d.id===docId));
  const doc = folder.docs.find(d=>d.id===docId);
  const v = addVersion(doc, versionMeta);
  return res.json(v);
});

router.get('/dealroom/:projectId', (req,res)=>{
  const dr = dealRooms.find(d=>d.projectId===req.params.projectId);
  return res.json(dr);
});

export default router;
