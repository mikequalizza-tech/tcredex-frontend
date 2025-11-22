import { broadcast } from '../../events/eventBus.js';
import { EVENT_TYPES } from '../../events/types.js';

export function updateCommit(commit, status){
  const updated = {
    ...commit,
    status,
    updatedAt: new Date().toISOString()
  };
  broadcast(EVENT_TYPES.ALLOCATION_UPDATED, { projectId: commit.projectId, investorId: commit.investorId, status });
  return updated;
}
