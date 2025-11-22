import { useEffect, useState } from 'react';

export default function LiveToast({ event }){
  const [show, setShow] = useState(true);

  useEffect(()=>{
    const t = setTimeout(()=>setShow(false), 3000);
    return ()=>clearTimeout(t);
  },[]);

  if(!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-3 rounded shadow">
      <div className="font-bold">{event.type}</div>
      <div className="text-sm">{JSON.stringify(event.payload)}</div>
    </div>
  );
}
