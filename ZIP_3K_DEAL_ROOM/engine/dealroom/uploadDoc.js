import { broadcast } from '../../events/eventBus.js';
import { EVENT_TYPES } from '../../events/types.js';

export function uploadDoc(dealRoom, folderName, docMeta){
  const folder = dealRoom.folders.find(f=>f.name===folderName);
  if(!folder) throw new Error('Folder not found');

  const doc = {
    id: 'doc_' + Date.now(),
    ...docMeta,
    uploadedAt: new Date().toISOString(),
    versions: []
  };
  folder.docs.push(doc);

  broadcast(EVENT_TYPES.DOC_UPLOADED, {projectId:dealRoom.projectId, folder:folderName, docId:doc.id});
  return doc;
}
