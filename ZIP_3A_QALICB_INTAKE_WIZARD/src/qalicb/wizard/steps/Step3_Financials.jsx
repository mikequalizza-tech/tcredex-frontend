import { useState } from 'react';

export default function Step3_Financials({next,back}){
  const [revenue,setRevenue] = useState('');
  const [projectCost,setProjectCost] = useState('');

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Financials</h2>
      <input className="border p-2 w-full mb-3" placeholder="Annual Revenue" value={revenue} onChange={e=>setRevenue(e.target.value)}/>
      <input className="border p-2 w-full mb-3" placeholder="Project Cost" value={projectCost} onChange={e=>setProjectCost(e.target.value)}/>
      <div className="flex space-x-3">
        <button className="p-2 border" onClick={back}>Back</button>
        <button className="bg-blue-500 text-white p-2 rounded" onClick={()=>next({revenue,projectCost})}>Next</button>
      </div>
    </div>
  );
}
