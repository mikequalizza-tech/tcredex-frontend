import { useState } from 'react';

export default function Step1_Basics({next}){
  const [name,setName] = useState('');
  const [type,setType] = useState('');

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Basic Information</h2>
      <input className="border p-2 w-full mb-3" placeholder="Business Name" value={name} onChange={e=>setName(e.target.value)}/>
      <input className="border p-2 w-full mb-3" placeholder="Entity Type" value={type} onChange={e=>setType(e.target.value)}/>
      <button className="bg-blue-500 text-white p-2 rounded" onClick={()=>next({name,type})}>Next</button>
    </div>
  );
}
