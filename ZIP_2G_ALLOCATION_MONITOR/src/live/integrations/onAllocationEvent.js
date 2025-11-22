import { useAllocationStore } from '../../allocation/useAllocationStore.js';

export function handleAllocationEvent(event){
  const { cdeId, amount } = event;
  const store = useAllocationStore.getState();
  store.updateOne(cdeId, amount);
}
