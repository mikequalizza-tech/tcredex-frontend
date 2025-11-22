import React from 'react';

export default function InstantMatchPreview({ preview }){
  if(!preview) return null;

  return (
    <div className="p-4 bg-white border rounded shadow mt-4">
      <h3 className="font-bold mb-2 text-lg">Instant Match Preview</h3>

      <div className="mb-4">
        <h4 className="font-semibold">Top CDE Matches</h4>
        {preview.cdeMatches?.slice(0,3).map((m,i)=>(
          <div key={i} className="border-b py-2">
            <div className="font-bold">{m.cde.name} — Score {m.total}</div>
            <pre className="text-xs">{JSON.stringify(m.explanation,null,2)}</pre>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-semibold">Top Investor Matches</h4>
        {preview.investorMatches?.slice(0,3).map((m,i)=>(
          <div key={i} className="border-b py-2">
            <div className="font-bold">{m.investor.name} — Score {m.total}</div>
            <pre className="text-xs">{JSON.stringify(m.explanation,null,2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
