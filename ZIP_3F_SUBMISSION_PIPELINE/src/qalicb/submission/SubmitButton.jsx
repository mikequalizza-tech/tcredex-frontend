export default function SubmitButton({ onSubmit }){
  return (
    <button 
      className="bg-green-600 text-white p-3 rounded shadow mt-4 font-bold"
      onClick={onSubmit}
    >
      Submit Project
    </button>
  );
}
