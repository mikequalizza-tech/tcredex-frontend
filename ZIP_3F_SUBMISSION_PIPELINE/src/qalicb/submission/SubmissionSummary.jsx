export default function SubmissionSummary({ result }){
  if(!result) return null;

  return (
    <div className="p-4 bg-white border rounded shadow mt-4">
      <h3 className="font-bold text-lg mb-2">Submission Summary</h3>
      <div className="text-sm mb-3">Project ID: {result.project.id}</div>
      <pre className="text-xs bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
