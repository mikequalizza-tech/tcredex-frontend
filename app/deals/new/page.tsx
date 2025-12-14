'use client';

import { useRouter } from 'next/navigation';
import { IntakeShell, IntakeData } from '@/components/intake-v4';

export default function NewDealPage() {
  const router = useRouter();

  const handleSave = async (data: IntakeData, readinessScore: number) => {
    console.log('Saving draft...', { data, readinessScore });
    
    // In production, this would call the API
    // await fetch('/api/deals', { method: 'POST', body: JSON.stringify({ data, readinessScore, status: 'draft' }) });
    
    // Show success message
    alert('Draft saved successfully!');
  };

  const handleSubmit = async (data: IntakeData, readinessScore: number) => {
    console.log('Submitting to marketplace...', { data, readinessScore });
    
    // In production, this would call the API
    // const response = await fetch('/api/deals', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ data, readinessScore, status: 'submitted' }) 
    // });
    // const deal = await response.json();
    
    // For demo, simulate success and redirect
    alert('Deal submitted to marketplace!');
    router.push('/deals');
  };

  return (
    <IntakeShell 
      onSave={handleSave}
      onSubmit={handleSubmit}
    />
  );
}
