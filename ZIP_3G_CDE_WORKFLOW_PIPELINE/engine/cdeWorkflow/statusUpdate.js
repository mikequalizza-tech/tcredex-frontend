import { broadcast } from '../../events/eventBus.js';
import { EVENT_TYPES } from '../../events/types.js';

export function updateCDEStatus(record, status){
  const updated = { ...record, status, updatedAt: new Date().toISOString() };
  broadcast(EVENT_TYPES.ALLOCATION_UPDATED, updated);
  return updated;
}
