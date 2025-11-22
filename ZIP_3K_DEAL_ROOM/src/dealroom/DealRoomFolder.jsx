export default function DealRoomFolder({ folder, onUpload }){
  return (
    <div className="p-4 border rounded mb-4 bg-white">
      <h3 className="font-bold">{folder.name}</h3>
      {folder.docs.map((d,i)=>(
        <div key={i} className="p-2 border mt-2 rounded">
          <div className="font-semibold">{d.title}</div>
          <div className="text-xs">Uploaded: {d.uploadedAt}</div>
          <div className="text-xs">Versions: {d.versions.length}</div>
        </div>
      ))}

      <button className="p-2 mt-3 border" onClick={()=>onUpload(folder.name)}>
        Upload Document
      </button>
    </div>
  );
}
