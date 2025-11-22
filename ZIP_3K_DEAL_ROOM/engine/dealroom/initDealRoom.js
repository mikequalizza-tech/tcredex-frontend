export function initDealRoom(projectId){
  return {
    projectId,
    folders: [
      {name:'00_Executive_Summary', docs:[]},
      {name:'01_Financials', docs:[]},
      {name:'02_Governance', docs:[]},
      {name:'03_Impact', docs:[]},
      {name:'04_Environmental', docs:[]},
      {name:'05_Legal', docs:[]},
      {name:'99_Internal_Notes', docs:[]}
    ],
    createdAt: new Date().toISOString()
  };
}
