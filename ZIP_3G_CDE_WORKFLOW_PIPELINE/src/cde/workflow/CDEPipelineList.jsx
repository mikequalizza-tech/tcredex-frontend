import CDEPipelineCard from './CDEPipelineCard.jsx';

export default function CDEPipelineList({ pipeline, onStatusChange }){
  return (
    <div className="p-4 bg-white border rounded shadow">
      <h3 className="font-bold mb-3">CDE Project Pipeline</h3>
      {pipeline.map((rec,i)=>(
        <CDEPipelineCard 
          key={i} 
          record={rec}
          onStatusChange={(status)=>onStatusChange(rec, status)}
        />
      ))}
    </div>
  );
}
