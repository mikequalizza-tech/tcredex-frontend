import { useEffect } from 'react';
import { initWS } from './wsClient.js';
import { useEventStore } from './useEventStore.js';

export function useLiveEvents(){
  const addEvent = useEventStore(state=>state.addEvent);

  useEffect(()=>{
    initWS((type,payload,ts)=>{
      addEvent({type,payload,ts});
    });
  },[]);
}
