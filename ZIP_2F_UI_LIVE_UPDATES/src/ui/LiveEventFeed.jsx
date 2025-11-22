import { useEventStore } from '../live/useEventStore.js';

export default function LiveEventFeed(){
  const events = useEventStore(state=>state.events);

  return (
    <div className="p-4 border-l w-80 h-full overflow-y-auto bg-white">
      <h2 className="font-bold mb-2">Live Feed</h2>
      {events.map((e,i)=>(
        <div key={i} className="border-b py-2">
          <div className="text-xs">{new Date(e.ts).toLocaleString()}</div>
          <div className="font-bold">{e.type}</div>
          <pre className="text-xs">{JSON.stringify(e.payload,null,2)}</pre>
        </div>
      ))}
    </div>
  );
}
