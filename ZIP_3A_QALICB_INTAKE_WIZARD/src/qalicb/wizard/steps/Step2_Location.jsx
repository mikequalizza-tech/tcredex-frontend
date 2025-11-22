import { useState } from 'react';

export default function Step2_Location({next,back}){
  const [address,setAddress] = useState('');
  const [tract,setTract] = useState('');

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Location</h2>
      <input className="border p-2 w-full mb-3" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)}/>
      <input className="border p-2 w-full mb-3" placeholder="Census Tract" value={tract} onChange={e=>setTract(e.target.value)}/>
      <div className="flex space-x-3">
        <button className="p-2 border" onClick={back}>Back</button>
        <button className="bg-blue-500 text-white p-2 rounded" onClick={()=>next({address,tract})}>Next</button>
      </div>
    </div>
  );
}
