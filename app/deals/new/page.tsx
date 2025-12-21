'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth';
import { IntakeShell, IntakeData } from '@/components/intake-v4';
import Link from 'next/link';

export default function NewDealPage() {
  const router = useRouter();
  const { orgType, isLoading, isAuthenticated } = useCurrentUser();

  // Role-based access control - only sponsors can submit deals
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">You need to sign in to submit a deal.</p>
          <Link href="/signin" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (orgType !== 'sponsor') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Sponsor Access Only</h1>
          <p className="text-gray-400 mb-6">
            Only Project Sponsors can submit deals to the marketplace. 
            {orgType === 'cde' && ' As a CDE, you can review and match with submitted deals in your Pipeline.'}
            {orgType === 'investor' && ' As an Investor, you can browse and invest in deals from the Marketplace.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/deals" 
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Browse Marketplace
            </Link>
            <Link 
              href="/dashboard" 
              className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
