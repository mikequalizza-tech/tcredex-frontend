export default function CDEPipelineCard({ record, onStatusChange }){
  const colors = {
    'pending-review': 'bg-yellow-100',
    'needs-info': 'bg-red-100',
    'accepted': 'bg-green-100',
    'rejected': 'bg-gray-200'
  };

  return (
    <div className={"p-4 border rounded mb-3 " + colors[record.status]}>
      <div className="font-bold mb-1">Project: {record.projectId}</div>
      <div className="text-sm mb-2">Status: {record.status}</div>

      <div className="flex space-x-2">
        <button className="p-1 border" onClick={()=>onStatusChange('accepted')}>Accept</button>
        <button className="p-1 border" onClick={()=>onStatusChange('needs-info')}>Needs Info</button>
        <button className="p-1 border" onClick={()=>onStatusChange('rejected')}>Reject</button>
      </div>
    </div>
  );
}
