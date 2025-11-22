import { create } from 'zustand';

export const useAllocationStore = create((set)=>({
  allocations: {},
  setAllocations: (data)=> set({allocations: data}),
  updateOne: (cdeId, amount)=> set(state=>({
    allocations:{...state.allocations, [cdeId]:amount}
  }))
}));
