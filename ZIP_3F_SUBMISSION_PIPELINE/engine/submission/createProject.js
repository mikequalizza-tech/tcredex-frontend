import { appendAudit } from '../audit/append.js';
import { broadcast } from '../../events/eventBus.js';
import { EVENT_TYPES } from '../../events/types.js';

export function createProjectRecord(intakeData){
  const project = {
    id: 'proj_' + Date.now(),
    ...intakeData,
    createdAt: new Date().toISOString()
  };

  // Audit log
  const auditRec = appendAudit(project, {}, {}, { explanation:'Project Created' });

  // Emit event
  broadcast(EVENT_TYPES.DOC_UPLOADED, { projectId: project.id, status: 'created' });

  return { project, auditRec };
}
