import { useState } from 'react';

export default function Step4_Impact({next,back}){
  const [jobs,setJobs] = useState('');
  const [communityBenefit,setCommunityBenefit] = useState('');

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Impact Metrics</h2>
      <input className="border p-2 w-full mb-3" placeholder="Projected Jobs Created" value={jobs} onChange={e=>setJobs(e.target.value)}/>
      <textarea className="border p-2 w-full mb-3" placeholder="Community Benefit Summary" value={communityBenefit} onChange={e=>setCommunityBenefit(e.target.value)}/>
      <div className="flex space-x-3">
        <button className="p-2 border" onClick={back}>Back</button>
        <button className="bg-blue-500 text-white p-2 rounded" onClick={()=>next({jobs,communityBenefit})}>Next</button>
      </div>
    </div>
  );
}
