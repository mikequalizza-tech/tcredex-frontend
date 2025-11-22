import InvestorCommitCard from './InvestorCommitCard.jsx';

export default function InvestorCommitList({ commits, onUpdate }){
  return (
    <div className="p-4 bg-white border rounded shadow">
      <h3 className="font-bold mb-3">Investor Commitments</h3>
      {commits.map((c,i)=>(
        <InvestorCommitCard key={i} commit={c} onUpdate={(commit,status)=>onUpdate(commit,status)} />
      ))}
    </div>
  );
}
