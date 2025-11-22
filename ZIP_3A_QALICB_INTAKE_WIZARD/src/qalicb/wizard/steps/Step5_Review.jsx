export default function Step5_Review({data,back}){
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Review & Submit</h2>
      <pre className="bg-gray-100 p-4 rounded mb-4">{JSON.stringify(data,null,2)}</pre>
      <div className="flex space-x-3">
        <button className="p-2 border" onClick={back}>Back</button>
        <button className="bg-green-600 text-white p-2 rounded">Submit</button>
      </div>
    </div>
  );
}
