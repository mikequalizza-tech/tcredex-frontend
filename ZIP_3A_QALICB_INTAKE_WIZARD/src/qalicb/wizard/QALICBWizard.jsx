import { useState } from 'react';
import Step1_Basics from './steps/Step1_Basics.jsx';
import Step2_Location from './steps/Step2_Location.jsx';
import Step3_Financials from './steps/Step3_Financials.jsx';
import Step4_Impact from './steps/Step4_Impact.jsx';
import Step5_Review from './steps/Step5_Review.jsx';

export default function QALICBWizard(){
  const [step,setStep] = useState(1);
  const [data,setData] = useState({});

  const next = (d)=>{ setData({...data,...d}); setStep(step+1); };
  const back = ()=> setStep(step-1);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {step===1 && <Step1_Basics next={next}/>}
      {step===2 && <Step2_Location next={next} back={back}/>}
      {step===3 && <Step3_Financials next={next} back={back}/>}
      {step===4 && <Step4_Impact next={next} back={back}/>}
      {step===5 && <Step5_Review data={data} back={back}/>}
    </div>
  );
}
