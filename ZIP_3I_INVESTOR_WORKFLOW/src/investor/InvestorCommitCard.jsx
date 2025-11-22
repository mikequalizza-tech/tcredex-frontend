export default function InvestorCommitCard({ commit, onUpdate }){
  const colors = {
    'soft': 'bg-yellow-100',
    'hard': 'bg-green-100',
    'withdrawn': 'bg-gray-200'
  };

  return (
    <div className={"p-4 border rounded mb-3 " + colors[commit.status]}>
      <div className="font-bold mb-1">Commitment: {commit.id}</div>
      <div className="text-sm mb-1">Investor: {commit.investorId}</div>
      <div className="text-sm mb-1">Amount: ${commit.amount}</div>
      <div className="text-sm mb-2">Status: {commit.status}</div>

      <div className="flex space-x-2">
        <button className="p-1 border" onClick={()=>onUpdate(commit,'hard')}>Hard Commit</button>
        <button className="p-1 border" onClick={()=>onUpdate(commit,'withdrawn')}>Withdraw</button>
      </div>
    </div>
  );
}
