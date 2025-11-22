import DealRoomFolder from './DealRoomFolder.jsx';

export default function DealRoomViewer({ dealRoom, onUpload }){
  if(!dealRoom) return null;

  return (
    <div className="p-4">
      <h2 className="font-bold text-xl mb-4">Project Deal Room</h2>
      {dealRoom.folders.map((f,i)=>(
        <DealRoomFolder key={i} folder={f} onUpload={onUpload}/>
      ))}
    </div>
  );
}
