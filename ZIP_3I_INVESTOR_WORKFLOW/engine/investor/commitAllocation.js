import { broadcast } from '../../events/eventBus.js';
import { EVENT_TYPES } from '../../events/types.js';

export function commitAllocation(projectId, investorId, amount){
  const commit = {
    id: 'commit_' + Date.now(),
    projectId,
    investorId,
    amount,
    status: 'soft',
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
  broadcast(EVENT_TYPES.ALLOCATION_UPDATED, { projectId, investorId, amount, status:'soft' });
  return commit;
}
