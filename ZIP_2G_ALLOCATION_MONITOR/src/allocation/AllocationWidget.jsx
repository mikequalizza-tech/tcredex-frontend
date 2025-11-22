import { useAllocationStore } from './useAllocationStore.js';

export default function AllocationWidget(){
  const allocations = useAllocationStore(s=>s.allocations);
  return (
    <div className="p-4 bg-white border rounded shadow">
      <h3 className="font-bold mb-2">Live Allocation Monitor</h3>
      {Object.entries(allocations).map(([cde,amt])=>(
        <div key={cde} className="mb-2">
          <div className="font-semibold">{cde}</div>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div className="bg-green-500 h-2 rounded" style={{width: amt + '%'}}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
