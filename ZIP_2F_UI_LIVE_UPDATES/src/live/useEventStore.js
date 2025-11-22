import { create } from 'zustand';

export const useEventStore = create((set)=>({
  events: [],
  addEvent: (ev)=> set(state=>({events:[ev, ...state.events]}))
}));
